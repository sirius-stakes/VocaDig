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

/**
 * キュレーション済みタグの定義。
 * aliases には VocaDB が返す表記ゆれ・英語別名・日本語別名を列挙する。
 * enName はフィルタ・検索で使う正規化後の代表タグ名。
 */
interface CuratedTagDefinition extends CuratedTag {
  aliases?: readonly string[];
}

const CURATED_TAG_DEFINITIONS: CuratedTagDefinition[] = [
  // --- ムード ---
  { id: 'dark', name: 'ダーク', enName: 'dark', category: 'mood', aliases: ['darkness'] },
  {
    id: 'melancholic',
    name: '切ない',
    enName: 'melancholic',
    category: 'mood',
    aliases: ['melancholy', '切ない'],
  },
  { id: 'downer', name: 'ダウナー', enName: 'downer', category: 'mood' },
  {
    id: 'catchy',
    name: '中毒性',
    enName: 'catchy',
    category: 'mood',
    aliases: ['addictive', 'earworm'],
  },
  {
    id: 'refreshing',
    name: '爽やか',
    enName: 'refreshing',
    category: 'mood',
    aliases: ['uplifting', 'fresh', '爽快'],
  },
  {
    id: 'emotional',
    name: 'エモい',
    enName: 'emotional',
    category: 'mood',
    aliases: ['emo', 'emotions', 'bittersweet', 'エモ'],
  },
  {
    id: 'creepy',
    name: '不穏・狂気',
    enName: 'creepy',
    category: 'mood',
    aliases: ['horror', 'madness', 'eerie', 'unsettling', 'insane', '不穏', '狂気'],
  },
  {
    id: 'fantasy',
    name: '幻想的',
    enName: 'fantasy',
    category: 'mood',
    aliases: ['dreamy', 'ethereal', 'dreamlike', '幻想'],
  },
  {
    id: 'cute',
    name: 'かわいい',
    enName: 'cute',
    category: 'mood',
    aliases: ['kawaii'],
  },
  {
    id: 'stylish',
    name: 'おしゃれ',
    enName: 'stylish',
    category: 'mood',
    aliases: ['fashionable', 'fashion', 'オシャレ'],
  },
  {
    id: 'sad',
    name: '泣ける',
    enName: 'sad',
    category: 'mood',
    aliases: ['tearjerker', 'tearful', '泣ける'],
  },

  // --- ジャンル ---
  {
    id: 'electro-swing',
    name: 'エレクトロスウィング',
    enName: 'electro swing',
    category: 'genre',
    aliases: ['electro-swing'],
  },
  { id: 'rock', name: 'ロック', enName: 'rock', category: 'genre', aliases: ['ロック'] },
  { id: 'jazz', name: 'ジャズ', enName: 'jazz', category: 'genre' },
  {
    id: 'chiptune',
    name: 'チップチューン',
    enName: 'chiptune',
    category: 'genre',
    aliases: ['chip tune', '8bit', '8-bit'],
  },
  {
    id: 'japanese',
    name: '和風',
    enName: '和風',
    category: 'genre',
    aliases: ['japanese', 'japanese style', 'wa style'],
  },
  {
    id: 'lo-fi',
    name: 'Lo-Fi',
    enName: 'lo-fi',
    category: 'genre',
    aliases: ['lofi', 'lo fi'],
  },
  { id: 'electronic', name: 'エレクトロ', enName: 'electronic', category: 'genre', aliases: ['electronica'] },
  {
    id: 'edm',
    name: 'EDM',
    enName: 'edm',
    category: 'genre',
    aliases: ['electronic dance', 'electronic dance music'],
  },
  {
    id: 'drum-and-bass',
    name: 'ドラムンベース',
    enName: 'drum and bass',
    category: 'genre',
    aliases: ['dnb', 'drum & bass', 'drum n bass', 'drumandbass'],
  },
  {
    id: 'vocaloid-rock',
    name: 'ボカロロック',
    enName: 'vocaloid rock',
    category: 'genre',
    aliases: ['vocalorock', 'vocaloid-rock', 'j-rock', 'jrock', 'ボカロロック'],
  },
  {
    id: 'metal',
    name: 'メタル',
    enName: 'metal',
    category: 'genre',
    aliases: [
      'heavy metal',
      'metalcore',
      'alternative metal',
      'nu metal',
      'power metal',
      'symphonic metal',
      'death metal',
      'black metal',
      'thrash metal',
      'progressive metal',
      'industrial metal',
      'speed metal',
      'doom metal',
      'メタル',
      'ヘヴィメタル',
    ],
  },
  {
    id: 'j-pop',
    name: 'ポップス',
    enName: 'j-pop',
    category: 'genre',
    aliases: ['jpop', 'j pop', 'japanese pop', 'ポップス'],
  },
  {
    id: 'acoustic',
    name: 'アコースティック',
    enName: 'acoustic',
    category: 'genre',
    aliases: ['acoustic guitar', 'acoustic rock', 'unplugged', 'アコースティック'],
  },
  {
    id: 'hip-hop',
    name: 'ラップ・ヒップホップ',
    enName: 'hip hop',
    category: 'genre',
    aliases: ['hip-hop', 'rap', 'rapping', 'rap music', 'j-rap', 'ラップ', 'ヒップホップ'],
  },
  { id: 'pop', name: 'ポップ', enName: 'pop', category: 'genre', aliases: ['ポップ'] },

  // --- 楽器・特徴 ---
  { id: 'piano', name: 'ピアノ', enName: 'piano', category: 'instrument' },
  {
    id: 'guitar',
    name: 'ギター',
    enName: 'guitar',
    category: 'instrument',
    aliases: ['electric guitar', 'ギター'],
  },
  {
    id: 'guitar-rock',
    name: 'ギターロック',
    enName: 'guitar rock',
    category: 'instrument',
    aliases: ['guitar-rock', 'rock guitar', 'ギターロック'],
  },
  {
    id: 'synth',
    name: 'シンセ重視',
    enName: 'synthesizer',
    category: 'instrument',
    aliases: ['synth', 'synth-pop', 'synthpop', 'シンセ', 'シンセサイザー'],
  },
  {
    id: 'bassline',
    name: 'ベースライン',
    enName: 'bassline',
    category: 'instrument',
    aliases: ['bass guitar', 'bass line', 'slap bass', 'slap bassline', 'bass', 'ベース', 'ベースライン'],
  },
  {
    id: 'odd-time-signature',
    name: '変拍子',
    enName: 'odd time signature',
    category: 'tempo_style',
    aliases: ['odd meter', '変拍子'],
  },

  // --- テンポ・スタイル ---
  {
    id: 'fast-tempo',
    name: '疾走感',
    enName: 'fast tempo',
    category: 'tempo_style',
    aliases: ['uptempo', '疾走感'],
  },
  {
    id: 'high-bpm',
    name: '高速BPM',
    enName: 'high bpm',
    category: 'tempo_style',
    aliases: ['high tempo', 'fast bpm', '超高速', '高速bpm'],
  },
  { id: 'ballad', name: 'バラード', enName: 'ballad', category: 'tempo_style' },
  {
    id: 'key-modulation',
    name: '転調',
    enName: 'key modulation',
    category: 'tempo_style',
    aliases: ['modulation', 'key change', 'key-modulation', '転調'],
  },
];

/** UIのフィルタに使うキュレーション済みタグ */
export const CURATED_TAGS: CuratedTag[] = CURATED_TAG_DEFINITIONS;

/** タグ名の表記ゆれを吸収するキー（normalizeTagName と同じ規則） */
function tagAliasKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * VocaDBの英語・日本語タグ名からキュレーション済みタグを引くマップ。
 * 代表名（enName）を優先し、その後に別名・日本語名を登録する。
 */
export const CURATED_TAG_BY_ALIAS: ReadonlyMap<string, CuratedTag> = (() => {
  const map = new Map<string, CuratedTag>();
  for (const tag of CURATED_TAG_DEFINITIONS) {
    map.set(tagAliasKey(tag.enName), tag);
  }
  for (const tag of CURATED_TAG_DEFINITIONS) {
    const candidates = [
      tag.name,
      tag.id.replace(/-/g, ' '),
      ...(tag.aliases ?? []),
    ];
    for (const candidate of candidates) {
      const key = tagAliasKey(candidate);
      if (key && !map.has(key)) map.set(key, tag);
    }
  }
  return map;
})();

/** 生のタグ名からキュレーション済みタグを解決する（大文字小文字・別名を吸収） */
export function resolveCuratedTag(raw: string): CuratedTag | undefined {
  return CURATED_TAG_BY_ALIAS.get(tagAliasKey(raw));
}

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
