import { useCallback, useEffect, useState } from 'react';
import {
  ACCENT_THEME_BY_ID,
  ACCENT_THEME_STORAGE_KEY,
  DEFAULT_ACCENT_THEME,
  isAccentThemeId,
  type AccentTheme,
  type AccentThemeId,
} from '../constants/accentThemes';

export type Theme = 'light' | 'dark';

/** localStorage に保存するテーマ設定のキー */
export const THEME_STORAGE_KEY = 'vocadig-theme';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function readStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage が使えない環境でもテーマ切替自体は機能させる
  }
}

function readStoredAccentTheme(): AccentThemeId {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_THEME;
  try {
    const stored = window.localStorage.getItem(ACCENT_THEME_STORAGE_KEY);
    return isAccentThemeId(stored) ? stored : DEFAULT_ACCENT_THEME;
  } catch {
    return DEFAULT_ACCENT_THEME;
  }
}

function persistAccentTheme(accentTheme: AccentThemeId): void {
  try {
    window.localStorage.setItem(ACCENT_THEME_STORAGE_KEY, accentTheme);
  } catch {
    // localStorage が使えない環境でも推しカラー切替自体は機能させる
  }
}

/** 現在のアクセントテーマ定義（不明なIDの場合はデフォルト） */
function resolveAccentTheme(accentTheme: AccentThemeId): AccentTheme {
  return ACCENT_THEME_BY_ID.get(accentTheme) ?? ACCENT_THEME_BY_ID.get(
    DEFAULT_ACCENT_THEME,
  )!;
}

/**
 * `html` 要素の `dark` クラス / `data-accent` 属性と localStorage を同期する
 * テーマ管理フック。ライト・ダークと推しカラーは独立して切り替えられる。
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(
    () => readStoredTheme() ?? getSystemTheme(),
  );
  const [accentTheme, setAccentThemeState] = useState<AccentThemeId>(
    readStoredAccentTheme,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = accentTheme;

    // モバイルブラウザのアドレスバー色も推しカラーに合わせる
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (meta) {
      meta.content = resolveAccentTheme(accentTheme).primary;
    }
  }, [accentTheme]);

  // ユーザーが明示的に選ぶまでは OS のカラースキーム変更に追従する
  useEffect(() => {
    if (readStoredTheme() || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      // ユーザーが明示的に選んだテーマがある場合は上書きしない
      if (readStoredTheme()) return;
      setThemeState(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      persistTheme(next);
      return next;
    });
  }, []);

  const setAccentTheme = useCallback((next: AccentThemeId) => {
    persistAccentTheme(next);
    setAccentThemeState(next);
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
    accentTheme,
    accentThemeMeta: resolveAccentTheme(accentTheme),
    setAccentTheme,
  };
}
