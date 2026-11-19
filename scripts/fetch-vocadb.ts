import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { resolveCuratedTag } from '../src/constants/masterData';
import type { VocaSong } from '../src/types/song';
import {
  normalizeVocaDbSong,
  type VocaDbSongContract,
} from '../src/utils/vocadbMapper';

const API_URL = 'https://vocadb.net/api/songs';
const USER_AGENT = 'VocaDig-DataFetcher/1.0';
/** 全リクエスト間の最小待機時間（ms） */
const MIN_REQUEST_INTERVAL_MS = 1800;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [10_000, 30_000, 60_000];
const DEFAULT_PAGE_SIZE = 100;

/**
 * ① 王道・人気名曲枠の目標生件数
 * タグ枠・隠れた名曲枠との重複が多いため、重複排除後 約2,500曲を満たすには
 * 人気枠・トレンド枠をそれぞれ1,400件程度まで取得する必要がある。
 */
const POPULAR_TARGET = 1400;
/** ② 2020年以降トレンド枠の目標生件数 */
const TREND_TARGET = 1400;
/** ③ タグ別枠：1タグあたりの目標生件数 */
const TAG_BUCKET_TARGET = 60;
/** ③ タグ別枠の1ページあたり件数 */
const TAG_BUCKET_PAGE_SIZE = 60;
/** ④ 隠れた名曲枠の目標件数（保存条件を満たす曲） */
const HIDDEN_GEM_TARGET = 400;
const HIDDEN_GEM_MAX_PAGES = 45;

const CACHE_PATH = resolve('.cache/vocadb-buckets.json');
const OUTPUT_PATH = resolve('public/data/songs.json');

/**
 * ムード・ジャンルタグ別バケットで取得するVocaDBタグ。
 * 別名（例: j-rock → ボカロロック）は vocadbMapper 側で正規化される。
 * 20タグ × 60件 ≒ 1,200件（重複排除後 約1,000曲）を目標とする。
 */
const TAG_BUCKET_TAGS = [
  // ムード系
  'refreshing',
  'bittersweet',
  'creepy',
  'fantasy',
  'cute',
  'stylish',
  'sad',
  // ジャンル系
  'edm',
  'drum and bass',
  'j-rock',
  'metal',
  'j-pop',
  'acoustic guitar',
  'rapping',
  // 楽器・特徴系
  'synthesizer',
  'bass guitar',
  'key modulation',
  'piano',
  '和風',
  'chiptune',
] as const;

interface BucketDefinition {
  key: string;
  label: string;
  /** URLSearchParams に追加するパラメータ */
  params: [string, string][];
  maxPages: number;
  pageSize: number;
  /** 指定時は、生データがこの件数に達するまでページを進める */
  targetCount?: number;
  /** 指定時は、条件を満たす曲がこの件数に達するまでページを進める */
  targetValidCount?: number;
  /** バケット固有の保存条件 */
  accept?: (song: VocaSong) => boolean;
}

interface BucketCacheEntry {
  label: string;
  fetchedAt: string;
  items: VocaDbSongContract[];
  /** 次にリクエストするAPIのstart値（途中再開用） */
  nextStart?: number;
  /** 取得済みページ数（途中再開用） */
  pagesFetched?: number;
  /** 検索条件のシグネチャ（条件変更時にキャッシュを破棄する） */
  signature?: string;
}

interface BucketCacheFile {
  version: 1 | 2;
  savedAt: string;
  buckets: Record<string, BucketCacheEntry>;
}

interface SongSearchResponse {
  items?: VocaDbSongContract[];
  totalCount?: number;
}

const commonParams: [string, string][] = [
  ['songTypes', 'Original'],
  ['fields', 'Artists,Tags,PVs,Names,BPM'],
];

const bucketDefinitions: BucketDefinition[] = [
  {
    key: 'popular',
    label: '王道・人気名曲枠',
    params: [...commonParams, ['sort', 'RatingScore']],
    maxPages: Math.ceil(POPULAR_TARGET / DEFAULT_PAGE_SIZE),
    pageSize: DEFAULT_PAGE_SIZE,
    targetCount: POPULAR_TARGET,
  },
  {
    key: 'trend',
    label: '2020年以降トレンド枠',
    params: [
      ...commonParams,
      ['afterDate', '2020-01-01'],
      ['sort', 'RatingScore'],
    ],
    maxPages: Math.ceil(TREND_TARGET / DEFAULT_PAGE_SIZE),
    pageSize: DEFAULT_PAGE_SIZE,
    targetCount: TREND_TARGET,
  },
  ...TAG_BUCKET_TAGS.map<BucketDefinition>((tagName) => {
    const curated = resolveCuratedTag(tagName);
    return {
      key: `tag:${tagName}`,
      label: `タグ「${curated?.name ?? tagName}」枠`,
      params: [
        ...commonParams,
        ['tagName[]', tagName],
        ['sort', 'RatingScore'],
      ],
      // 既存キャッシュ（50件）から不足分だけ追加取得できるよう2ページ以上を許可
      maxPages: 3,
      pageSize: TAG_BUCKET_PAGE_SIZE,
      targetCount: TAG_BUCKET_TARGET,
    };
  }),
  {
    key: 'hidden',
    label: '隠れた名曲（Hidden Gem）枠',
    // VocaDB APIはmaxScoreを受け付けないため、取得後にratingScoreで絞り込む
    params: [
      ...commonParams,
      ['minScore', '20'],
      ['maxScore', '150'],
      ['sort', 'FavoritedTimes'],
    ],
    maxPages: HIDDEN_GEM_MAX_PAGES,
    pageSize: DEFAULT_PAGE_SIZE,
    targetValidCount: HIDDEN_GEM_TARGET,
    accept: (song) => song.ratingScore >= 20 && song.ratingScore <= 150,
  },
];

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

/** 直前のリクエスト完了から1.8秒以上空ける */
async function waitForRequestSlot(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  const remaining = MIN_REQUEST_INTERVAL_MS - elapsed;
  if (remaining > 0) {
    await sleep(remaining);
  }
}

/**
 * レート制限とリトライを守ってJSONを取得する。
 * 429 / 5xx は 10秒 → 30秒 → 60秒 の指数バックオフで最大3回リトライ。
 */
async function requestJson<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    await waitForRequestSlot();

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      lastRequestAt = Date.now();
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 60_000;
        console.warn(
          `  ネットワークエラー: ${String(error)} → ${delay / 1000}秒後にリトライ`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }

    lastRequestAt = Date.now();

    if (response.ok) {
      return (await response.json()) as T;
    }

    const body = (await response.text()).slice(0, 300);
    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS_MS[attempt] ?? 60_000;
      console.warn(
        `  HTTP ${response.status} (${body}) → ${delay / 1000}秒後にリトライ (${attempt + 1}/${MAX_RETRIES})`,
      );
      await sleep(delay);
      continue;
    }

    throw new Error(`VocaDB APIエラー: HTTP ${response.status} ${body}`);
  }
}

function buildPageUrl(
  bucket: BucketDefinition,
  start: number,
  maxResults: number,
): string {
  const url = new URL(API_URL);
  for (const [key, value] of bucket.params) {
    url.searchParams.append(key, value);
  }
  url.searchParams.set('start', String(start));
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('getTotalCount', 'true');
  return url.toString();
}

/** 検索条件が同じキャッシュだけを再利用するためのシグネチャ */
function buildBucketSignature(bucket: BucketDefinition): string {
  return JSON.stringify(bucket.params);
}

/** データとして保存する最低条件（有効PV + 特徴タグ） */
function isSaveableSong(song: VocaSong): boolean {
  return song.pvs.length > 0 && song.tags.length > 0;
}

function matchesBucket(song: VocaSong, bucket: BucketDefinition): boolean {
  return isSaveableSong(song) && (bucket.accept?.(song) ?? true);
}

async function loadCache(): Promise<BucketCacheFile> {
  try {
    const raw = await readFile(CACHE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<BucketCacheFile>;
    if (parsed && typeof parsed === 'object' && parsed.buckets) {
      // 旧バージョン（version 1）のキャッシュもそのまま再利用する
      return {
        version: 2,
        savedAt: parsed.savedAt ?? '',
        buckets: parsed.buckets,
      };
    }
  } catch {
    // キャッシュが無い／壊れている場合は新規作成する
  }
  return { version: 2, savedAt: new Date().toISOString(), buckets: {} };
}

async function saveCache(cache: BucketCacheFile): Promise<void> {
  cache.savedAt = new Date().toISOString();
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), 'utf-8');
}

/** バケットの目標件数に達しているか */
function isBucketSatisfied(
  bucket: BucketDefinition,
  items: VocaDbSongContract[],
  validCount: number,
): boolean {
  if (bucket.targetCount !== undefined) {
    return items.length >= bucket.targetCount;
  }
  if (bucket.targetValidCount !== undefined) {
    return validCount >= bucket.targetValidCount;
  }
  return items.length > 0;
}

/** 保存条件を満たす曲を数える（キャッシュ再開時の再計算用） */
function countValidItems(
  bucket: BucketDefinition,
  items: VocaDbSongContract[],
): number {
  if (bucket.targetValidCount === undefined) return 0;
  return items.filter((raw) =>
    matchesBucket(normalizeVocaDbSong(raw), bucket),
  ).length;
}

async function fetchBucket(
  bucket: BucketDefinition,
  cache: BucketCacheFile,
  refresh: boolean,
): Promise<VocaDbSongContract[]> {
  const cached = refresh ? undefined : cache.buckets[bucket.key];
  const signature = buildBucketSignature(bucket);
  const canReuse =
    cached !== undefined &&
    (cached.signature === undefined || cached.signature === signature);

  const seenIds = new Set<number>();
  const items: VocaDbSongContract[] = [];
  if (canReuse) {
    for (const raw of cached.items ?? []) {
      if (typeof raw?.id !== 'number' || seenIds.has(raw.id)) continue;
      seenIds.add(raw.id);
      items.push(raw);
    }
  }

  let nextStart = canReuse
    ? (cached.nextStart ?? cached.items?.length ?? 0)
    : 0;
  let pagesFetched = canReuse
    ? (cached.pagesFetched ??
      Math.ceil((cached.items?.length ?? 0) / bucket.pageSize))
    : 0;
  let validCount = countValidItems(bucket, items);

  if (canReuse && isBucketSatisfied(bucket, items, validCount)) {
    console.log(
      `[cache] ${bucket.label}: ${items.length}件（${cached.fetchedAt}）`,
    );
    return items;
  }

  if (canReuse && items.length > 0) {
    console.log(
      `[fetch] ${bucket.label}: 既存 ${items.length}件から再開（start=${nextStart}, ${pagesFetched}/${bucket.maxPages}ページ取得済み）`,
    );
  } else {
    console.log(`[fetch] ${bucket.label} を取得中...`);
  }

  while (pagesFetched < bucket.maxPages) {
    const remaining =
      bucket.targetCount !== undefined
        ? bucket.targetCount - items.length
        : bucket.pageSize;
    if (remaining <= 0) break;

    const requestSize =
      bucket.targetCount !== undefined
        ? Math.min(bucket.pageSize, remaining)
        : bucket.pageSize;
    const pageNumber = pagesFetched + 1;
    const url = buildPageUrl(bucket, nextStart, requestSize);
    const response = await requestJson<SongSearchResponse>(url);
    const pageItems = response.items ?? [];

    const newItems: VocaDbSongContract[] = [];
    for (const raw of pageItems) {
      if (typeof raw?.id !== 'number' || seenIds.has(raw.id)) continue;
      seenIds.add(raw.id);
      items.push(raw);
      newItems.push(raw);
    }

    validCount += countValidItems(bucket, newItems);
    // 重複を除いてもページ送りはAPIが返した件数だけ進める
    nextStart += pageItems.length;
    pagesFetched += 1;

    console.log(
      `  page ${pageNumber}/${bucket.maxPages}: +${pageItems.length}件（新規 ${newItems.length}件）` +
        (bucket.targetValidCount
          ? `（条件一致 累計 ${validCount}/${bucket.targetValidCount}）`
          : `（累計 ${items.length}/${bucket.targetCount ?? '-'}）`),
    );

    if (pageItems.length === 0) break;
    if (pageItems.length < requestSize) break;
    if (isBucketSatisfied(bucket, items, validCount)) break;
  }

  if (!isBucketSatisfied(bucket, items, validCount)) {
    console.warn(
      `  ※ ${bucket.label}: 取得可能なページが尽きました（${items.length}件` +
        (bucket.targetValidCount ? ` / 条件一致 ${validCount}件` : '') +
        '）',
    );
  }

  cache.buckets[bucket.key] = {
    label: bucket.label,
    fetchedAt: new Date().toISOString(),
    items,
    nextStart,
    pagesFetched,
    signature,
  };
  await saveCache(cache);
  console.log(`[fetch] ${bucket.label}: 生データ ${items.length}件`);
  return items;
}

/** 同じ楽曲が複数バケットに現れた場合はタグ等をマージする */
function mergeSongs(base: VocaSong, extra: VocaSong): VocaSong {
  const pvKeys = new Set(base.pvs.map((pv) => `${pv.service}:${pv.pvId}`));
  return {
    ...base,
    tags: [...new Set([...base.tags, ...extra.tags])],
    producers: [...new Set([...base.producers, ...extra.producers])],
    voicebanks: [...new Set([...base.voicebanks, ...extra.voicebanks])],
    pvs: [
      ...base.pvs,
      ...extra.pvs.filter(
        (pv) => !pvKeys.has(`${pv.service}:${pv.pvId}`),
      ),
    ],
    ratingScore: Math.max(base.ratingScore, extra.ratingScore),
    favoritedTimes: Math.max(base.favoritedTimes, extra.favoritedTimes),
  };
}

async function main(): Promise<void> {
  const refresh = process.argv.includes('--refresh');
  console.log('VocaDig 事前データ取得を開始します');
  console.log(
    `レート制限: リクエスト間 ${MIN_REQUEST_INTERVAL_MS}ms / User-Agent: ${USER_AGENT}`,
  );
  console.log(
    `リトライ: HTTP 429・5xx 時に 10s → 30s → 60s（最大${MAX_RETRIES}回）`,
  );
  console.log(`キャッシュ: ${CACHE_PATH}`);
  console.log(
    `目標件数: 王道${POPULAR_TARGET} / トレンド${TREND_TARGET} / ` +
      `タグ${TAG_BUCKET_TARGET}×${TAG_BUCKET_TAGS.length} / 隠れ${HIDDEN_GEM_TARGET}` +
      '（重複排除後 約2,500曲）',
  );
  if (refresh) console.log('--refresh 指定: キャッシュを無視します');

  const cache = await loadCache();
  const songsById = new Map<number, VocaSong>();
  const bucketCounts: { label: string; raw: number; saved: number }[] = [];

  for (const bucket of bucketDefinitions) {
    const rawItems = await fetchBucket(bucket, cache, refresh);
    let saved = 0;

    for (const raw of rawItems) {
      const song = normalizeVocaDbSong(raw);
      if (!matchesBucket(song, bucket)) continue;

      const existing = songsById.get(song.id);
      songsById.set(song.id, existing ? mergeSongs(existing, song) : song);
      saved += 1;
    }

    bucketCounts.push({ label: bucket.label, raw: rawItems.length, saved });
    console.log(`[normalize] ${bucket.label}: 保存対象 ${saved}件`);
  }

  const songs = [...songsById.values()].sort(
    (a, b) => b.ratingScore - a.ratingScore || a.id - b.id,
  );

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(songs, null, 2)}\n`, 'utf-8');

  const withBpm = songs.filter((song) => song.bpm !== null).length;
  const withPv = songs.filter((song) => song.pvs.length > 0).length;
  const bytes = Buffer.byteLength(JSON.stringify(songs), 'utf-8');

  console.log('\n===== 取得結果 =====');
  for (const count of bucketCounts) {
    console.log(
      `- ${count.label}: 生 ${count.raw}件 / 保存対象 ${count.saved}件`,
    );
  }
  console.log(`ユニーク楽曲数: ${songs.length}件`);
  console.log(`BPMあり: ${withBpm}件 / PVあり: ${withPv}件`);
  console.log(
    `保存先: ${OUTPUT_PATH}（${(bytes / 1024 / 1024).toFixed(2)} MB）`,
  );

  console.log('\n===== サンプル =====');
  for (const song of songs.slice(0, 5)) {
    console.log(
      `- ${song.title} / ${song.artistString || 'アーティスト不明'} / ` +
        `BPM ${song.bpm ?? '不明'} / tags: ${song.tags.slice(0, 6).join(', ')} / ` +
        `PV: ${song.pvs.map((pv) => pv.service).join(', ') || 'なし'}`,
    );
  }
}

main().catch((error) => {
  console.error('\nデータ取得に失敗しました:', error);
  process.exitCode = 1;
});
