import type { ReactNode } from 'react';
import type { AccentThemeId } from '../constants/accentThemes';
import type { AppMode } from '../types/song';
import type { Theme } from '../hooks/useTheme';
import { AccentThemePicker } from './AccentThemePicker';
import {
  HeartIcon,
  ListIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from './icons';

interface HeaderProps {
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  theme: Theme;
  onToggleTheme: () => void;
  accentTheme: AccentThemeId;
  onChangeAccentTheme: (accentTheme: AccentThemeId) => void;
  myListCount: number;
  onOpenMyList: () => void;
}

const MODE_TABS: {
  mode: AppMode;
  label: string;
  icon: ReactNode;
}[] = [
  {
    mode: 'filter_dig',
    label: '条件からディグる',
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  {
    mode: 'similar_recommend',
    label: '好きな曲から推薦',
    icon: <HeartIcon className="h-4 w-4" />,
  },
];

function ModeTabs({
  mode,
  onChangeMode,
  className,
}: {
  mode: AppMode;
  onChangeMode: (mode: AppMode) => void;
  className?: string;
}) {
  return (
    <nav className={`flex items-center gap-1 ${className ?? ''}`}>
      {MODE_TABS.map((tab) => {
        const active = tab.mode === mode;
        return (
          <button
            key={tab.mode}
            type="button"
            onClick={() => onChangeMode(tab.mode)}
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:flex-none sm:text-sm ${
              active
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg tint-shadow'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
            }`}
          >
            <span className={active ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Header({
  mode,
  onChangeMode,
  theme,
  onToggleTheme,
  accentTheme,
  onChangeAccentTheme,
  myListCount,
  onOpenMyList,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-lg font-black text-white shadow-lg tint-shadow">
            V
          </div>
          <div className="leading-tight">
            <p className="text-base font-black tracking-tight">VocaDig</p>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-slate-500 dark:text-slate-400">
              VOCALOID DIGGER
            </p>
          </div>
        </div>

        <ModeTabs
          mode={mode}
          onChangeMode={onChangeMode}
          className="ml-2 hidden md:flex"
        />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <AccentThemePicker
            accentTheme={accentTheme}
            onChangeAccentTheme={onChangeAccentTheme}
          />

          <button
            type="button"
            onClick={onOpenMyList}
            aria-label={`マイリストを開く（${myListCount}曲）`}
            className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 transition hover:border-fuchsia-400 hover:text-fuchsia-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-fuchsia-500 dark:hover:text-fuchsia-400 sm:px-3"
          >
            <ListIcon className="h-4 w-4" />
            <span className="hidden sm:inline">マイリスト</span>
            {myListCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] font-black text-white">
                {myListCount > 99 ? '99+' : myListCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? 'ライトモードに切り替え'
                : 'ダークモードに切り替え'
            }
            title={
              theme === 'dark'
                ? 'ライトモードに切り替え'
                : 'ダークモードに切り替え'
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200/70 px-4 py-2 dark:border-slate-800/70 md:hidden">
        <ModeTabs mode={mode} onChangeMode={onChangeMode} />
      </div>
    </header>
  );
}
