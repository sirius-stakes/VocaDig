import { isStopWordTag } from '../constants/masterData';
import type {
  RecommendedSong,
  SearchFilterState,
  TasteProfile,
  VocaSong,
} from '../types/song';
import { normalizeTagName } from './vocadbMapper';

/** 複数のシード曲に共通するタグへ掛ける重み */
export const SHARED_TAG_MULTIPLIER = 2.5;
/** BPM近接ボーナスの対象範囲（±BPM） */
export const BPM_BONUS_WINDOW = 15;
/** BPM近接ボーナスの最大加算点 */
const BPM_BONUS_MAX = 12;
/** 音声ライブラリ一致ボーナスの加算点 */
const VOICEBANK_BONUS = 8;
/** カードに表示する一致タグの最大件数 */
const MATCHED_TAG_LIMIT = 8;
/** レコメンドに残す最低マッチ率（%） */
export const RECOMMEND_MIN_MATCH_SCORE = 30;
/** レコメンド結果の最大件数 */
export const RECOMMEND_MAX_RESULTS = 50;

/**
 * 類似度計算では音楽的特徴ではないメタデータタグを除外する。
 * （動画仕様・配信ストア・リズムゲーム収録曲などのノイズ対策）
 */
const NOISE_TAG_PATTERNS: readonly RegExp[] = [
  /^karaoke available/,
  /subtitles?$/,
  /(^|\s)pv$/,
  /^4:3 aspect ratio$/,
  /^flashing lights warning$/,
  /^merch released$/,
  /^unsupported embed$/,
  /^animation meme source$/,
  /^video game official soundtrack release$/,
  /^(midi|vsq|vocal data) available$/,
  /^stem data/,
  /^(maimai|チュウニズム|オンゲキ|太鼓の達人|wacca|jubeat|reflec beat|music diver|ミライダガッキ|ユビート|groove coaster|sound voltex|dance dance revolution|pop'n music|typenist|ノスタルジア)/,
  /^(初音ミク|hatsune miku).*project diva/,
  /^(マジカルミライ|miku expo)/,
];

function isSimilarityTag(tag: string): boolean {
  if (!tag || isStopWordTag(tag)) return false;
  return !NOISE_TAG_PATTERNS.some((pattern) => pattern.test(tag));
}

function extractSimilarityTags(tags: string[]): string[] {
  return tags
    .map((tag) => normalizeTagName(tag))
    .filter((tag) => isSimilarityTag(tag));
}

function lower(value: string): string {
  return value.toLowerCase();
}

function matchesKeyword(song: VocaSong, keyword: string): boolean {
  const haystack = [
    song.title,
    song.artistString,
    ...song.producers,
    ...song.tags,
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(keyword);
}

/**
 * 隠れた名曲（Hidden Gem）スコア。
 * 特徴タグが多く、評価スコアが中堅〜控えめな曲を高く評価する。
 */
export function calculateHiddenGemScore(song: VocaSong): number {
  const featureTagScore =
    Math.min(extractSimilarityTags(song.tags).length, 30) * 2.5;

  const rating = song.ratingScore;
  let ratingBonus: number;
  if (rating >= 20 && rating <= 250) {
    ratingBonus = 40;
  } else if (rating < 20) {
    ratingBonus = 15 + Math.max(0, rating);
  } else {
    ratingBonus = Math.max(0, 40 - (rating - 250) / 25);
  }

  const favoriteBonus = Math.log10(song.favoritedTimes + 1) * 6;
  const metadataBonus = song.lengthSeconds > 0 ? 4 : 0;

  return featureTagScore + ratingBonus + favoriteBonus + metadataBonus;
}

function compareByPopular(a: VocaSong, b: VocaSong): number {
  return (
    b.ratingScore - a.ratingScore ||
    b.favoritedTimes - a.favoritedTimes ||
    a.id - b.id
  );
}

function compareByNewest(a: VocaSong, b: VocaSong): number {
  if (!a.publishDate && !b.publishDate) return compareByPopular(a, b);
  if (!a.publishDate) return 1;
  if (!b.publishDate) return -1;
  return b.publishDate.localeCompare(a.publishDate) || compareByPopular(a, b);
}

function compareByBpm(a: VocaSong, b: VocaSong, direction: 'asc' | 'desc'): number {
  if (a.bpm === null && b.bpm === null) return compareByPopular(a, b);
  if (a.bpm === null) return 1;
  if (b.bpm === null) return -1;
  const diff = direction === 'asc' ? a.bpm - b.bpm : b.bpm - a.bpm;
  return diff || compareByPopular(a, b);
}

function shuffleSongs(songs: VocaSong[]): VocaSong[] {
  const result = [...songs];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/**
 * 条件ディグ（Filter Dig）のフィルタリング＆ソート。
 * 元配列は変更せず、常に新しい配列を返す。
 */
export function filterAndSortSongs(
  songs: VocaSong[],
  filter: SearchFilterState,
): VocaSong[] {
  const keyword = lower(filter.keyword.trim());
  const selectedTags = new Set(
    filter.selectedTags.map((tag) => normalizeTagName(tag)).filter(Boolean),
  );
  const selectedVoicebanks = new Set(filter.selectedVoicebanks);
  const [bpmMin, bpmMax] = filter.bpmRange;

  const filtered = songs.filter((song) => {
    if (keyword && !matchesKeyword(song, keyword)) return false;

    if (selectedTags.size > 0) {
      const songTags = new Set(song.tags.map((tag) => normalizeTagName(tag)));
      if (filter.tagMatchMode === 'AND') {
        for (const tag of selectedTags) {
          if (!songTags.has(tag)) return false;
        }
      } else {
        let hasAny = false;
        for (const tag of selectedTags) {
          if (songTags.has(tag)) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) return false;
      }
    }

    if (selectedVoicebanks.size > 0) {
      if (!song.voicebanks.some((id) => selectedVoicebanks.has(id))) {
        return false;
      }
    }

    if (song.bpm === null) {
      if (!filter.includeUnknownBpm) return false;
    } else if (song.bpm < bpmMin || song.bpm > bpmMax) {
      return false;
    }

    return true;
  });

  switch (filter.sortBy) {
    case 'popular':
      return filtered.sort(compareByPopular);
    case 'newest':
      return filtered.sort(compareByNewest);
    case 'bpm_asc':
      return filtered.sort((a, b) => compareByBpm(a, b, 'asc'));
    case 'bpm_desc':
      return filtered.sort((a, b) => compareByBpm(a, b, 'desc'));
    case 'hidden_gem': {
      const scored = filtered.map((song) => ({
        song,
        score: calculateHiddenGemScore(song),
      }));
      scored.sort(
        (a, b) =>
          b.score - a.score ||
          a.song.ratingScore - b.song.ratingScore ||
          a.song.id - b.song.id,
      );
      return scored.map((entry) => entry.song);
    }
    case 'random':
      return shuffleSongs(filtered);
    default:
      return filtered;
  }
}

/**
 * 選択されたシード曲から嗜好プロファイルを生成する。
 * 複数のシード曲に共通して現れるタグは 2.5 倍の重みを与える。
 */
export function buildTasteProfile(seedSongs: VocaSong[]): TasteProfile {
  const tagCounts = new Map<string, number>();
  const voicebankCounts = new Map<number, number>();

  for (const seed of seedSongs) {
    const uniqueTags = new Set(extractSimilarityTags(seed.tags));
    for (const tag of uniqueTags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    for (const voicebankId of new Set(seed.voicebanks)) {
      voicebankCounts.set(
        voicebankId,
        (voicebankCounts.get(voicebankId) ?? 0) + 1,
      );
    }
  }

  const topTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({
      tag,
      count,
      weight: count > 1 ? count * SHARED_TAG_MULTIPLIER : count,
    }))
    .sort(
      (a, b) =>
        b.weight - a.weight ||
        b.count - a.count ||
        a.tag.localeCompare(b.tag),
    );

  const bpms = seedSongs
    .map((song) => song.bpm)
    .filter((bpm): bpm is number => bpm !== null && bpm > 0);
  const averageBpm =
    bpms.length > 0
      ? Math.round(bpms.reduce((sum, bpm) => sum + bpm, 0) / bpms.length)
      : null;

  const preferredVoicebanks = [...voicebankCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([voicebankId]) => voicebankId);

  return {
    seedSongs,
    topTags,
    averageBpm,
    preferredVoicebanks,
  };
}

export interface CalculateSimilarOptions {
  /** 同一音声ライブラリへのボーナスを有効にするか */
  voicebankBonus?: boolean;
  /** 返却する最大件数（既定・上限: 50） */
  limit?: number;
}

/**
 * シード曲群との類似度が高い楽曲をスコアリングして返す。
 * - タグ一致度（0〜100%に正規化）
 * - シード平均BPMとの近接ボーナス（±15 BPM以内）
 * - 同一音声ライブラリボーナス（ON/OFF可）
 * - マッチ率30%未満は除外し、スコア降順で最大50曲に制限
 */
export function calculateSimilarSongs(
  songs: VocaSong[],
  seedSongs: VocaSong[],
  options: CalculateSimilarOptions = {},
): RecommendedSong[] {
  if (seedSongs.length === 0) return [];

  const profile = buildTasteProfile(seedSongs);
  if (profile.topTags.length === 0) return [];

  const seedIds = new Set(seedSongs.map((song) => song.id));
  const preferredVoicebanks = new Set(profile.preferredVoicebanks);
  const totalWeight = profile.topTags.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );
  if (totalWeight <= 0) return [];

  const useVoicebankBonus = options.voicebankBonus ?? true;
  const limit = Math.min(
    Math.max(0, options.limit ?? RECOMMEND_MAX_RESULTS),
    RECOMMEND_MAX_RESULTS,
  );
  const results: RecommendedSong[] = [];

  for (const song of songs) {
    if (seedIds.has(song.id)) continue;

    const songTags = new Set(extractSimilarityTags(song.tags));
    if (songTags.size === 0) continue;

    let matchedWeight = 0;
    const matchedTags: string[] = [];
    for (const entry of profile.topTags) {
      if (!songTags.has(entry.tag)) continue;
      matchedWeight += entry.weight;
      matchedTags.push(entry.tag);
    }
    if (matchedTags.length === 0) continue;

    const tagScore = (matchedWeight / totalWeight) * 100;

    const bpmDiff =
      song.bpm !== null && profile.averageBpm !== null
        ? Math.abs(song.bpm - profile.averageBpm)
        : null;
    const bpmBonus =
      bpmDiff !== null && bpmDiff <= BPM_BONUS_WINDOW
        ? BPM_BONUS_MAX * (1 - bpmDiff / (BPM_BONUS_WINDOW + 1))
        : 0;

    const voicebankMatched =
      useVoicebankBonus &&
      song.voicebanks.some((id) => preferredVoicebanks.has(id));
    const voicebankScore = voicebankMatched ? VOICEBANK_BONUS : 0;

    const rawScore = tagScore + bpmBonus + voicebankScore;
    const matchScore = Math.round(Math.min(100, rawScore) * 10) / 10;

    // マッチ率30%未満の楽曲は推薦結果から除外する
    if (matchScore < RECOMMEND_MIN_MATCH_SCORE) continue;

    results.push({
      song,
      matchScore,
      matchedTags: matchedTags.slice(0, MATCHED_TAG_LIMIT),
      bpmDiff,
    });
  }

  results.sort(
    (a, b) =>
      b.matchScore - a.matchScore ||
      b.song.ratingScore - a.song.ratingScore ||
      b.song.favoritedTimes - a.song.favoritedTimes ||
      a.song.id - b.song.id,
  );

  return results.slice(0, Math.max(0, limit));
}
