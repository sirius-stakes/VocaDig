/** タグの分類カテゴリ */
export type TagCategory = 'mood' | 'genre' | 'instrument' | 'tempo_style';

/** キュレーション済みタグ（UIのフィルタで使用） */
export interface CuratedTag {
  /** アプリ内で一意なID（英語タグ名のスラッグ） */
  id: string;
  /** 日本語表示名 */
  name: string;
  /** VocaDB検索・照合に使う英語タグ名 */
  enName: string;
  category: TagCategory;
}

/** 音声ライブラリ（ボーカルバンク） */
export interface Voicebank {
  /** VocaDBのアーティストID */
  id: number;
  name: string;
  /** テーマカラー（HEX） */
  color: string;
}

/** 動画サイトのPV情報 */
export interface PVInfo {
  service: 'Youtube' | 'NicoNicoDouga';
  pvId: string;
  url: string;
  thumbUrl: string;
}

/** アプリ全体で共有する正規化済み楽曲データ */
export interface VocaSong {
  id: number;
  title: string;
  artistString: string;
  producers: string[];
  /** 音声ライブラリのVocaDBアーティストID */
  voicebanks: number[];
  bpm: number | null;
  lengthSeconds: number;
  publishDate: string;
  ratingScore: number;
  favoritedTimes: number;
  /** 正規化済みタグ（英語・小文字） */
  tags: string[];
  pvs: PVInfo[];
  vocadbUrl: string;
}

/** Filter Dig の検索条件 */
export interface SearchFilterState {
  keyword: string;
  selectedTags: string[];
  tagMatchMode: 'AND' | 'OR';
  selectedVoicebanks: number[];
  bpmRange: [number, number];
  includeUnknownBpm: boolean;
  sortBy:
    | 'popular'
    | 'newest'
    | 'bpm_asc'
    | 'bpm_desc'
    | 'hidden_gem'
    | 'random';
}

/** Like-to-Dig のレコメンド結果 */
export interface RecommendedSong {
  song: VocaSong;
  matchScore: number;
  matchedTags: string[];
  bpmDiff: number | null;
}

/** Like-to-Dig の嗜好プロファイル */
export interface TasteProfile {
  seedSongs: VocaSong[];
  topTags: { tag: string; count: number; weight: number }[];
  averageBpm: number | null;
  /** 選好する音声ライブラリのVocaDBアーティストID */
  preferredVoicebanks: number[];
}

/** アプリの表示モード */
export type AppMode = 'filter_dig' | 'similar_recommend';
