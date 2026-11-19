import {
  VOICEBANKS,
  VOICEBANK_BY_NAME,
  isStopWordTag,
  resolveCuratedTag,
} from '../constants/masterData';
import type { PVInfo, VocaSong } from '../types/song';

/** VocaDB API のタグ（SongForApiContract.tags） */
export interface VocaDbTagContract {
  count?: number;
  tag?: {
    id?: number;
    name?: string;
    additionalNames?: string;
  };
}

/** VocaDB API のアーティスト（ArtistForSongContract） */
export interface VocaDbArtistForSongContract {
  artist?: {
    id?: number;
    name?: string;
    artistType?: string;
    categories?: string;
    additionalNames?: string;
  };
  categories?: string;
  effectiveRoles?: string;
  roles?: string;
  isSupport?: boolean;
}

/** VocaDB API のPV（PVContract） */
export interface VocaDbPvContract {
  pvId?: string;
  service?: string;
  pvType?: string;
  url?: string;
  thumbUrl?: string;
  disabled?: boolean;
}

/** VocaDB API の楽曲（SongForApiContract の必要な項目のみ） */
export interface VocaDbSongContract {
  id: number;
  name?: string;
  defaultName?: string;
  artistString?: string;
  artists?: VocaDbArtistForSongContract[];
  bpm?: number;
  minMilliBpm?: number;
  maxMilliBpm?: number;
  lengthSeconds?: number;
  publishDate?: string;
  createDate?: string;
  ratingScore?: number;
  favoritedTimes?: number;
  tags?: VocaDbTagContract[];
  pvs?: VocaDbPvContract[];
  songType?: string;
}

/** 音声ライブラリとして扱うVocaDBアーティスト種別 */
const VOICEBANK_ARTIST_TYPES = new Set([
  'Vocaloid',
  'UTAU',
  'CeVIO',
  'Synthesizer V',
  'VOICEVOX',
  'NEUTRINO',
  'VoiSona',
  'AIVOICE',
  'Voiceroid',
]);

/** タグ名の表記ゆれを吸収する */
export function normalizeTagName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * VocaDBの英語・日本語タグ名をキュレーション済みタグの代表名へ正規化する。
 * 対応するキュレーションタグが無い場合は、従来どおり正規化したタグ名を返す。
 */
export function canonicalizeTagName(raw: string): string {
  const normalized = normalizeTagName(raw);
  const curated = resolveCuratedTag(normalized);
  return curated ? normalizeTagName(curated.enName) : normalized;
}

/** 汎用タグを除外し、重複のない正規化済みタグ一覧を返す */
export function normalizeTags(tags: VocaDbTagContract[] | undefined): string[] {
  const result = new Set<string>();
  for (const entry of tags ?? []) {
    const name = entry.tag?.name;
    if (!name) continue;
    const normalized = normalizeTagName(name);
    if (!normalized || isStopWordTag(normalized)) continue;
    result.add(canonicalizeTagName(normalized));
  }
  return [...result];
}

/** 高速BPMとみなす閾値 */
export const HIGH_BPM_THRESHOLD = 180;

/**
 * タグだけでは表現しにくい特徴を、BPMやタグの組み合わせから補完する。
 * - 高速BPM: BPM 180以上
 * - ギターロック: ロックかつギター系タグを持つ曲
 */
export function deriveFeatureTags(tags: string[], bpm: number | null): string[] {
  const result = new Set(tags);

  const highBpmTag = resolveCuratedTag('high bpm');
  if (highBpmTag && bpm !== null && bpm >= HIGH_BPM_THRESHOLD) {
    result.add(normalizeTagName(highBpmTag.enName));
  }

  const guitarRockTag = resolveCuratedTag('guitar rock');
  const hasGuitar = result.has('guitar') || result.has('guitar solo');
  if (guitarRockTag && result.has('rock') && hasGuitar) {
    result.add(normalizeTagName(guitarRockTag.enName));
  }

  return [...result];
}

/** マスター定義に一致する音声ライブラリIDを解決する */
function resolveVoicebankId(name: string): number | undefined {
  const normalized = name.trim().toLowerCase();
  const exact = VOICEBANK_BY_NAME.get(normalized);
  if (exact) return exact.id;

  for (const voicebank of VOICEBANKS) {
    const base = voicebank.name.toLowerCase();
    // 「初音ミク V3 (Solid)」「鏡音リン Append (Power)」などの派生表記を拾う
    if (
      normalized.startsWith(`${base} `) ||
      normalized.startsWith(`${base}(`) ||
      normalized.startsWith(`${base}・`)
    ) {
      return voicebank.id;
    }
  }
  return undefined;
}

/** 正規化済みの音声ライブラリID一覧を返す */
export function extractVoicebankIds(
  artists: VocaDbArtistForSongContract[] | undefined,
  artistString: string,
): number[] {
  const ids = new Set<number>();

  for (const entry of artists ?? []) {
    const artist = entry.artist;
    if (!artist?.name || !artist.artistType) continue;
    if (!VOICEBANK_ARTIST_TYPES.has(artist.artistType)) continue;
    const id = resolveVoicebankId(artist.name);
    if (id !== undefined) ids.add(id);
  }

  // APIのアーティスト情報に漏れがある場合に備え、artistStringからも補完する
  const normalizedArtistString = artistString.toLowerCase();
  for (const voicebank of VOICEBANKS) {
    if (normalizedArtistString.includes(voicebank.name.toLowerCase())) {
      ids.add(voicebank.id);
    }
  }

  return [...ids];
}

/** 作曲・作詞などの制作者名を抽出する */
export function extractProducers(
  artists: VocaDbArtistForSongContract[] | undefined,
): string[] {
  const producers = new Set<string>();

  for (const entry of artists ?? []) {
    const artist = entry.artist;
    if (!artist?.name) continue;

    const categories = `${entry.categories ?? ''},${artist.categories ?? ''}`;
    const roles = `${entry.effectiveRoles ?? ''},${entry.roles ?? ''}`;
    if (
      artist.artistType === 'Producer' ||
      categories.includes('Producer') ||
      roles.includes('Composer') ||
      roles.includes('Lyricist')
    ) {
      producers.add(artist.name);
    }
  }

  return [...producers];
}

/** YouTube用のサムネイルURLを組み立てる */
function buildYoutubeThumbnail(pvId: string): string {
  return `https://i.ytimg.com/vi/${pvId}/mqdefault.jpg`;
}

/** ニコニコ動画用のサムネイルURLを組み立てる */
function buildNicoThumbnail(pvId: string, provided?: string): string {
  if (provided?.startsWith('http')) return provided;

  const numericId = pvId.match(/\d+/)?.[0];
  if (!numericId) return provided ?? '';
  return `https://nicovideo.cdn.nimg.jp/thumbnails/${numericId}/${numericId}`;
}

/** PVの優先度（Originalを最優先） */
function pvPriority(pv: VocaDbPvContract): number {
  if (pv.pvType === 'Original') return 3;
  if (pv.pvType === 'Reprint') return 2;
  if (pv.pvType === 'Other') return 1;
  return 0;
}

/** サービスごとに最良のPVを1件選ぶ */
function pickBestPv(
  pvs: VocaDbPvContract[],
  service: 'Youtube' | 'NicoNicoDouga',
): VocaDbPvContract | undefined {
  return pvs
    .filter(
      (pv) =>
        !pv.disabled &&
        pv.service === service &&
        typeof pv.pvId === 'string' &&
        pv.pvId.length > 0,
    )
    .sort((a, b) => pvPriority(b) - pvPriority(a))[0];
}

/** YouTube / ニコニコ動画のPVを抽出する */
export function extractPvs(
  pvs: VocaDbPvContract[] | undefined,
): PVInfo[] {
  const allPvs = pvs ?? [];
  const result: PVInfo[] = [];

  const youtube = pickBestPv(allPvs, 'Youtube');
  if (youtube?.pvId) {
    result.push({
      service: 'Youtube',
      pvId: youtube.pvId,
      url: youtube.url ?? `https://www.youtube.com/watch?v=${youtube.pvId}`,
      thumbUrl: buildYoutubeThumbnail(youtube.pvId),
    });
  }

  const nico = pickBestPv(allPvs, 'NicoNicoDouga');
  if (nico?.pvId) {
    result.push({
      service: 'NicoNicoDouga',
      pvId: nico.pvId,
      url: nico.url ?? `https://www.nicovideo.jp/watch/${nico.pvId}`,
      thumbUrl: buildNicoThumbnail(nico.pvId, nico.thumbUrl),
    });
  }

  return result;
}

/** VocaDBのBPM表記（ミリBPM）をnumberへ変換する */
export function normalizeBpm(song: VocaDbSongContract): number | null {
  const milliValues = [song.minMilliBpm, song.maxMilliBpm].filter(
    (value): value is number => typeof value === 'number' && value > 0,
  );

  if (milliValues.length > 0) {
    const average =
      milliValues.reduce((sum, value) => sum + value, 0) / milliValues.length;
    const bpm = Math.round(average / 1000);
    return bpm > 0 ? bpm : null;
  }

  if (typeof song.bpm === 'number' && song.bpm > 0) {
    return Math.round(song.bpm);
  }

  return null;
}

function normalizeDate(value: string | undefined): string {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
}

/**
 * VocaDB APIの生Songオブジェクトを、アプリ共通の VocaSong 型へ安全に変換する。
 */
export function normalizeVocaDbSong(raw: VocaDbSongContract): VocaSong {
  const title = raw.name?.trim() || raw.defaultName?.trim() || `Song #${raw.id}`;
  const artistString = raw.artistString?.trim() ?? '';
  const bpm = normalizeBpm(raw);

  return {
    id: raw.id,
    title,
    artistString,
    producers: extractProducers(raw.artists),
    voicebanks: extractVoicebankIds(raw.artists, artistString),
    bpm,
    lengthSeconds:
      typeof raw.lengthSeconds === 'number' && raw.lengthSeconds > 0
        ? raw.lengthSeconds
        : 0,
    publishDate: normalizeDate(raw.publishDate ?? raw.createDate),
    ratingScore:
      typeof raw.ratingScore === 'number' && Number.isFinite(raw.ratingScore)
        ? raw.ratingScore
        : 0,
    favoritedTimes:
      typeof raw.favoritedTimes === 'number' ? raw.favoritedTimes : 0,
    tags: deriveFeatureTags(normalizeTags(raw.tags), bpm),
    pvs: extractPvs(raw.pvs),
    vocadbUrl: `https://vocadb.net/S/${raw.id}`,
  };
}
