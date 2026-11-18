import type { CuratedTag, Voicebank } from '../types/song';

/** 主要音声ライブラリ（VocaDBアーティストIDとテーマカラー） */
export const VOICEBANKS: Voicebank[] = [
  { id: 1, name: '初音ミク', color: '#39C5BB' },
  { id: 14, name: '鏡音リン', color: '#F7D046' },
  { id: 15, name: '鏡音レン', color: '#F2B84B' },
  { id: 2, name: '巡音ルカ', color: '#F2A0C4' },
  { id: 176, name: 'MEIKO', color: '#D6001C' },
  { id: 71, name: 'KAITO', color: '#1E5AA8' },
  { id: 3, name: 'GUMI', color: '#00A960' },
  { id: 504, name: 'IA', color: '#9BC7E4' },
  { id: 21165, name: 'v flower', color: '#7E6BD9' },
  { id: 83928, name: '可不', color: '#66C7B5' },
  { id: 191, name: '歌愛ユキ', color: '#B8D8F0' },
  { id: 623, name: '結月ゆかり', color: '#A98BD6' },
  { id: 116, name: '重音テト', color: '#E60012' },
  { id: 58538, name: 'ずんだもん', color: '#8FD400' },
  { id: 49701, name: '音街ウナ', color: '#FF8FB1' },
];

/** UIのフィルタに使うキュレーション済みタグ */
export const CURATED_TAGS: CuratedTag[] = [
  { id: 'dark', name: 'ダーク', enName: 'dark', category: 'mood' },
  { id: 'melancholic', name: '切ない', enName: 'melancholic', category: 'mood' },
  { id: 'downer', name: 'ダウナー', enName: 'downer', category: 'mood' },
  { id: 'catchy', name: '中毒性', enName: 'catchy', category: 'mood' },
  {
    id: 'fast-tempo',
    name: '疾走感',
    enName: 'fast tempo',
    category: 'tempo_style',
  },
  {
    id: 'electro-swing',
    name: 'エレクトロスウィング',
    enName: 'electro swing',
    category: 'genre',
  },
  { id: 'rock', name: 'ロック', enName: 'rock', category: 'genre' },
  { id: 'jazz', name: 'ジャズ', enName: 'jazz', category: 'genre' },
  { id: 'piano', name: 'ピアノ', enName: 'piano', category: 'instrument' },
  {
    id: 'odd-time-signature',
    name: '変拍子',
    enName: 'odd time signature',
    category: 'tempo_style',
  },
  { id: 'chiptune', name: 'チップチューン', enName: 'chiptune', category: 'genre' },
  { id: 'japanese', name: '和風', enName: '和風', category: 'genre' },
  { id: 'lo-fi', name: 'Lo-Fi', enName: 'lo-fi', category: 'genre' },
  { id: 'ballad', name: 'バラード', enName: 'ballad', category: 'tempo_style' },
  { id: 'electronic', name: 'エレクトロ', enName: 'electronic', category: 'genre' },
  {
    id: 'drum-and-bass',
    name: 'ドラムンベース',
    enName: 'drum and bass',
    category: 'tempo_style',
  },
  { id: 'guitar', name: 'ギター', enName: 'guitar', category: 'instrument' },
  { id: 'pop', name: 'ポップ', enName: 'pop', category: 'genre' },
];

/**
 * 類似度計算・タグ検索から除外する汎用タグ。
 * すべて normalizeTagName 済みの小文字表記で保持する。
 */
export const STOP_WORD_TAGS: readonly string[] = [
  'vocaloid',
  'vocaloid original',
  'vocaloid song',
  'original',
  'original song',
  'オリジナル曲',
  '殿堂入り',
  '伝説入り',
  'ミリオン',
  '神話入り',
  'ボカコレ',
  'utau',
  'synthesizer v',
  'synthv',
  'cevio',
  'voiceroid',
  'voicevox',
  'neutrino',
  'voisona',
  'aivoice',
  'vocaloid 2',
  'vocaloid 3',
  'vocaloid 4',
  'vocaloid 5',
  'vocaloid 6',
  'piapro',
  'youtube',
  'nicovideo',
  'bilibili',
  'soundcloud',
  '初音ミク',
  'hatsune miku',
  'miku',
  '鏡音リン',
  'kagamine rin',
  '鏡音レン',
  'kagamine len',
  '巡音ルカ',
  'megurine luka',
  'meiko',
  'kaito',
  'gumi',
  'ia',
  'v flower',
  '可不',
  'kafu',
  '歌愛ユキ',
  'kaai yuki',
  '結月ゆかり',
  'yuzuki yukari',
  '重音テト',
  'kasane teto',
  'ずんだもん',
  'zundamon',
  '音街ウナ',
  'otohime una',
  'project diva',
  'sega feat. hatsune miku project',
  'プロセカ',
  'project sekai',
];

const stopWordSet = new Set(STOP_WORD_TAGS.map((tag) => tag.toLowerCase()));

/** 汎用ストップワードかどうか（大文字小文字は無視） */
export function isStopWordTag(tag: string): boolean {
  return stopWordSet.has(tag.trim().toLowerCase());
}

/** VocaDBアーティストIDから音声ライブラリを引く */
export const VOICEBANK_BY_ID: ReadonlyMap<number, Voicebank> = new Map(
  VOICEBANKS.map((voicebank) => [voicebank.id, voicebank]),
);

/** 表示名から音声ライブラリを引く */
export const VOICEBANK_BY_NAME: ReadonlyMap<string, Voicebank> = new Map(
  VOICEBANKS.map((voicebank) => [voicebank.name.toLowerCase(), voicebank]),
);

/** 英語タグ名からキュレーション済みタグを引く */
export const CURATED_TAG_BY_EN_NAME: ReadonlyMap<string, CuratedTag> = new Map(
  CURATED_TAGS.map((tag) => [tag.enName.toLowerCase(), tag]),
);
