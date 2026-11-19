/** 音声ライブラリ別の推しカラーテーマ定義 */
export interface AccentTheme {
  /** `<html data-accent="...">` に設定するID */
  id: AccentThemeId;
  /** ドロップダウンに表示するキャラクター名 */
  name: string;
  /** ヘッダーのボタンに表示する短縮名 */
  shortName: string;
  /** メインカラー（500系） */
  primary: string;
  /** サブカラー（600系） */
  secondary: string;
}

export type AccentThemeId =
  | 'miku'
  | 'teto'
  | 'rinlen'
  | 'luka'
  | 'kafu'
  | 'flower'
  | 'gumi'
  | 'zundamon';

/** localStorage に保存するアクセントテーマ設定のキー */
export const ACCENT_THEME_STORAGE_KEY = 'vocadig-accent-theme';

/** 初回訪問時のアクセントテーマ */
export const DEFAULT_ACCENT_THEME: AccentThemeId = 'miku';

export const ACCENT_THEMES: readonly AccentTheme[] = [
  {
    id: 'miku',
    name: '初音ミク',
    shortName: 'ミク',
    primary: '#06b6d4',
    secondary: '#0891b2',
  },
  {
    id: 'teto',
    name: '重音テト',
    shortName: 'テト',
    primary: '#e11d48',
    secondary: '#be123c',
  },
  {
    id: 'rinlen',
    name: '鏡音リン・レン',
    shortName: 'リン・レン',
    primary: '#f59e0b',
    secondary: '#d97706',
  },
  {
    id: 'luka',
    name: '巡音ルカ',
    shortName: 'ルカ',
    primary: '#ec4899',
    secondary: '#db2777',
  },
  {
    id: 'kafu',
    name: '可不 KAFU',
    shortName: 'KAFU',
    primary: '#6366f1',
    secondary: '#4f46e5',
  },
  {
    id: 'flower',
    name: 'v flower',
    shortName: 'flower',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
  },
  {
    id: 'gumi',
    name: 'GUMI',
    shortName: 'GUMI',
    primary: '#10b981',
    secondary: '#059669',
  },
  {
    id: 'zundamon',
    name: 'ずんだもん',
    shortName: 'ずんだもん',
    primary: '#84cc16',
    secondary: '#65a30d',
  },
];

const ACCENT_THEME_IDS = new Set<string>(
  ACCENT_THEMES.map((theme) => theme.id),
);

export function isAccentThemeId(value: unknown): value is AccentThemeId {
  return typeof value === 'string' && ACCENT_THEME_IDS.has(value);
}

export const ACCENT_THEME_BY_ID: ReadonlyMap<AccentThemeId, AccentTheme> =
  new Map(ACCENT_THEMES.map((theme) => [theme.id, theme]));
