import { useEffect, useRef, useState } from 'react';
import {
  ACCENT_THEMES,
  ACCENT_THEME_BY_ID,
  type AccentThemeId,
} from '../constants/accentThemes';
import { CheckIcon, ChevronDownIcon } from './icons';

interface AccentThemePickerProps {
  accentTheme: AccentThemeId;
  onChangeAccentTheme: (accentTheme: AccentThemeId) => void;
}

/** 音声ライブラリ別の推しカラーをワンクリックで切り替えるポップオーバー */
export function AccentThemePicker({
  accentTheme,
  onChangeAccentTheme,
}: AccentThemePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const current =
    ACCENT_THEME_BY_ID.get(accentTheme) ?? ACCENT_THEMES[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`推しカラーを切り替える（現在: ${current.name}）`}
        title={`推しカラー: ${current.name}`}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400 sm:gap-2 sm:px-2.5"
      >
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900"
          style={{
            backgroundImage: `linear-gradient(135deg, ${current.primary}, ${current.secondary})`,
          }}
        />
        <span className="hidden max-w-[5.5rem] truncate lg:inline">
          {current.shortName}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
            <p className="text-[10px] font-black tracking-[0.16em] text-slate-400 dark:text-slate-500">
              推しカラー
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              音声ライブラリのイメージカラーに切り替え
            </p>
          </div>

          <ul
            role="listbox"
            aria-label="推しカラーテーマ"
            className="max-h-[min(70vh,26rem)] overflow-y-auto p-1.5"
          >
            {ACCENT_THEMES.map((theme) => {
              const selected = theme.id === accentTheme;
              return (
                <li key={theme.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChangeAccentTheme(theme.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                      selected
                        ? 'tint-bg text-cyan-700 dark:tint-bg dark:text-cyan-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black">
                        {theme.name}
                      </span>
                      <span className="block truncate text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
                        {theme.primary} / {theme.secondary}
                      </span>
                    </span>
                    {selected && (
                      <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
