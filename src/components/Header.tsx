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
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold sm:flex-none sm:text-sm ${
              active ? 'glass-accent-tab' : 'glass-tab-inactive'
            }`}
          >
            <span className={active ? '' : 'text-cyan-700 dark:text-cyan-300'}>
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
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="glass-accent-tab flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black">
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
            className="glass-neutral relative flex h-10 items-center gap-2 rounded-xl px-2.5 text-xs font-bold sm:px-3"
          >
            <ListIcon className="h-4 w-4" />
            <span className="hidden sm:inline">マイリスト</span>
            {myListCount > 0 && (
              <span className="glass-accent-chip flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black">
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
            className="glass-neutral flex h-10 w-10 items-center justify-center rounded-xl"
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
