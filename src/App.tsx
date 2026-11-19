import { useCallback, useEffect, useMemo, useState } from 'react';
import { FilterSidebar } from './components/FilterSidebar';
import { Header } from './components/Header';
import { MiniPlayer } from './components/MiniPlayer';
import { MyListModal } from './components/MyListModal';
import { SeedRecommendSidebar } from './components/SeedRecommendSidebar';
import { SongCard } from './components/SongCard';
import {
  ChevronDownIcon,
  HeartIcon,
  ResetIcon,
  SearchIcon,
  SlidersIcon,
  SparklesIcon,
  XIcon,
} from './components/icons';
import { DEFAULT_FILTER, SORT_OPTIONS } from './constants/search';
import { useMyList } from './hooks/useMyList';
import { useSongCatalog } from './hooks/useSongCatalog';
import { useTheme } from './hooks/useTheme';
import type { AppMode, SearchFilterState, VocaSong } from './types/song';
import {
  buildTasteProfile,
  calculateSimilarSongs,
  filterAndSortSongs,
  RECOMMEND_MAX_RESULTS,
  RECOMMEND_MIN_MATCH_SCORE,
} from './utils/recommendEngine';
import {
  readFilterFromUrl,
  readModeFromUrl,
  syncUrlWithFilters,
} from './utils/urlState';

const PAGE_SIZE = 30;

const MODE_COPY: Record<
  AppMode,
  { eyebrow: string; title: string; description: string }
> = {
  filter_dig: {
    eyebrow: 'FILTER DIG',
    title: '条件から、ボカロ曲をディグる。',
    description:
      'ムード・BPM・音声ライブラリを組み合わせて、まだ知らない一曲を掘り出そう。',
  },
  similar_recommend: {
    eyebrow: 'LIKE-TO-DIG',
    title: '好きな曲から、似た曲を掘る。',
    description:
      'シード曲のタグ・BPM・音声ライブラリを分析して、類似度の高い曲を提案します。',
  },
};

function App() {
  const {
    theme,
    toggleTheme,
    accentTheme,
    setAccentTheme,
  } = useTheme();
  const { songs, loading, error, reload } = useSongCatalog();
  const {
    myList,
    isInMyList,
    toggleMyList,
    removeFromMyList,
    clearMyList,
  } = useMyList();

  const [mode, setMode] = useState<AppMode>(() =>
    readModeFromUrl(window.location.search),
  );
  const [filter, setFilter] = useState<SearchFilterState>(() =>
    readFilterFromUrl(window.location.search),
  );
  const [seeds, setSeeds] = useState<VocaSong[]>([]);
  const [voicebankBonus, setVoicebankBonus] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [myListOpen, setMyListOpen] = useState(false);
  const [playerSong, setPlayerSong] = useState<VocaSong | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    syncUrlWithFilters(mode, filter);
  }, [mode, filter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, mode]);

  useEffect(() => {
    if (!myListOpen && !mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMyListOpen(false);
      setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [myListOpen, mobileSidebarOpen]);

  // モバイル用ドロワーを開いたままデスクトップ幅へ変わった場合は閉じる
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => {
      if (media.matches) setMobileSidebarOpen(false);
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const seedIds = useMemo(
    () => new Set(seeds.map((song) => song.id)),
    [seeds],
  );

  const filteredSongs = useMemo(
    () => filterAndSortSongs(songs, filter),
    [songs, filter],
  );

  const profile = useMemo(
    () => (seeds.length > 0 ? buildTasteProfile(seeds) : null),
    [seeds],
  );

  const recommendations = useMemo(
    () =>
      calculateSimilarSongs(songs, seeds, {
        voicebankBonus,
      }),
    [songs, seeds, voicebankBonus],
  );

  const handleAddSeed = useCallback((song: VocaSong) => {
    setSeeds((current) =>
      current.some((entry) => entry.id === song.id)
        ? current
        : [...current, song],
    );
  }, []);

  const handleRemoveSeed = useCallback((songId: number) => {
    setSeeds((current) => current.filter((song) => song.id !== songId));
  }, []);

  const handleClearSeeds = useCallback(() => {
    setSeeds([]);
  }, []);

  const handlePlay = useCallback((song: VocaSong) => {
    setPlayerSong(song);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setPlayerSong(null);
  }, []);

  /** マイリスト内の曲をまとめてシードに追加し、類似レコメンドへ移行する */
  const handleSeedMyList = useCallback(() => {
    setSeeds((current) => {
      const merged = new Map(current.map((song) => [song.id, song]));
      for (const song of myList) {
        if (!merged.has(song.id)) merged.set(song.id, song);
      }
      return [...merged.values()];
    });
    setMode('similar_recommend');
    setMobileSidebarOpen(false);
    setMyListOpen(false);
  }, [myList]);

  const handleChangeMode = useCallback((nextMode: AppMode) => {
    setMode(nextMode);
    setMobileSidebarOpen(false);
  }, []);

  const handleResetFilter = useCallback(() => {
    setFilter({ ...DEFAULT_FILTER });
  }, []);

  const isSeed = useCallback(
    (songId: number) => seedIds.has(songId),
    [seedIds],
  );

  const copy = MODE_COPY[mode];
  const isFilterMode = mode === 'filter_dig';

  const availableSongs = isFilterMode
    ? filteredSongs
    : recommendations.map((entry) => entry.song);
  const visibleSongs = availableSongs.slice(0, visibleCount);
  const recommendationById = useMemo(
    () => new Map(recommendations.map((entry) => [entry.song.id, entry])),
    [recommendations],
  );

  const remainingCount = Math.max(availableSongs.length - visibleSongs.length, 0);

  const sidebar = isFilterMode ? (
    <FilterSidebar
      value={filter}
      onChange={setFilter}
      onReset={handleResetFilter}
      matchedCount={filteredSongs.length}
      totalCount={songs.length}
    />
  ) : (
    <SeedRecommendSidebar
      allSongs={songs}
      seeds={seeds}
      profile={profile}
      voicebankBonus={voicebankBonus}
      onToggleVoicebankBonus={() => setVoicebankBonus((current) => !current)}
      onAddSeed={handleAddSeed}
      onRemoveSeed={handleRemoveSeed}
      onClearSeeds={handleClearSeeds}
    />
  );

  const renderEmptyState = () => {
    if (isFilterMode) {
      return (
        <div className="glass-panel rounded-3xl border border-dashed border-slate-300/80 px-6 py-14 text-center dark:border-slate-700/80">
          <div className="glass-accent-chip mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <SearchIcon className="h-7 w-7" />
          </div>
          <p className="mt-4 text-sm font-black">
            条件に一致する曲が見つかりませんでした
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            BPMレンジを広げる、タグをORにする、BPM未登録曲を含めるなど、条件をゆるめてみてください。
          </p>
          <button
            type="button"
            onClick={handleResetFilter}
            className="glass-neutral mx-auto mt-4 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
          >
            <ResetIcon className="h-3.5 w-3.5" />
            条件をリセット
          </button>
        </div>
      );
    }

    if (seeds.length === 0) {
      return (
        <div className="glass-accent-chip rounded-3xl border border-dashed border-[color:var(--accent-border)] px-6 py-14 text-center">
          <div className="glass-accent-tab mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <HeartIcon filled className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-black">
            まずは好きな曲を1曲選びましょう
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {mobileSidebarOpen
              ? 'シード曲を追加してください。'
              : '左のサイドバーからシード曲を追加すると、タグ・BPM・音声ライブラリから類似曲をスコアリングします。'}
          </p>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="glass-accent-button mx-auto mt-4 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black lg:hidden"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            シード曲を追加する
          </button>
        </div>
      );
    }

    return (
      <div className="glass-panel rounded-3xl border border-dashed border-slate-300/80 px-6 py-14 text-center dark:border-slate-700/80">
        <div className="glass-accent-chip mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <SparklesIcon className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-black">
          マッチ率{RECOMMEND_MIN_MATCH_SCORE}%以上の類似曲が見つかりませんでした
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          マッチ率{RECOMMEND_MIN_MATCH_SCORE}%以上の曲が見つかりませんでした。シード曲を追加するか、音声ライブラリ一致ボーナスを調整してみてください。
        </p>
        <button
          type="button"
          onClick={handleClearSeeds}
          className="glass-neutral mx-auto mt-4 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          シード曲をクリア
        </button>
      </div>
    );
  };

  return (
    <div className="app-shell min-h-screen text-slate-900 transition-colors dark:text-slate-100">
      <Header
        mode={mode}
        onChangeMode={handleChangeMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        accentTheme={accentTheme}
        onChangeAccentTheme={setAccentTheme}
        myListCount={myList.length}
        onOpenMyList={() => setMyListOpen(true)}
      />

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="検索条件を閉じる"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-slate-950/50 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          aria-label={isFilterMode ? '条件ディグのフィルター' : '類似レコメンドの設定'}
          className={
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 z-50 w-[88%] max-w-sm overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 lg:sticky lg:top-20 lg:z-auto lg:max-h-[calc(100vh-7rem)] lg:w-80 lg:max-w-none lg:shrink-0 lg:overflow-y-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none'
              : 'hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-7rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto'
          }
        >
          {mobileSidebarOpen && (
            <div className="mb-3 flex items-center justify-between lg:hidden">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400">
                {isFilterMode ? '検索条件' : 'シード曲と好みプロファイル'}
              </p>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="閉じる"
                className="glass-neutral rounded-lg p-2"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          {sidebar}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-4">
            <p className="glass-accent-text text-[10px] font-black tracking-[0.22em]">
              VOCADIG / {copy.eyebrow}
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
              {copy.title}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
              {copy.description}
            </p>
          </div>

          <div className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-black">
                {loading
                  ? '読み込み中...'
                  : isFilterMode
                    ? `${filteredSongs.length.toLocaleString('ja-JP')}曲がヒット`
                    : `${recommendations.length}曲を推薦`}
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                {loading
                  ? 'VocaDBの正規化済みデータを読み込んでいます'
                  : isFilterMode
                    ? filter.keyword ||
                      filter.selectedTags.length > 0 ||
                      filter.selectedVoicebanks.length > 0
                      ? 'キーワード・タグ・音声ライブラリ・BPMで絞り込み中'
                      : `収録 ${songs.length.toLocaleString('ja-JP')}曲から抽出`
                    : seeds.length > 0
                      ? `シード${seeds.length}曲のタグ・BPM・音声ライブラリから算出`
                      : 'シード曲を追加すると類似度順に表示します'}
              </p>
              {!isFilterMode && seeds.length > 0 && (
                <span className="glass-accent-chip mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                  <SparklesIcon className="h-2.5 w-2.5" />
                  {`マッチ率${RECOMMEND_MIN_MATCH_SCORE}%以上・上位最大${RECOMMEND_MAX_RESULTS}曲を表示中`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="glass-neutral flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold lg:hidden"
              >
                <SlidersIcon className="h-3.5 w-3.5" />
                {isFilterMode ? '条件' : 'シード'}
              </button>

              {isFilterMode && (
                <div className="relative">
                  <label htmlFor="sort-select" className="sr-only">
                    並び順
                  </label>
                  <select
                    id="sort-select"
                    value={filter.sortBy}
                    onChange={(event) =>
                      setFilter({
                        ...filter,
                        sortBy: event.target
                          .value as SearchFilterState['sortBy'],
                      })
                    }
                    className="glass-menu appearance-none rounded-xl py-2 pl-3 pr-8 text-xs font-bold"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="glass-panel flex animate-pulse gap-4 rounded-2xl p-4"
                >
                  <div className="aspect-video w-28 shrink-0 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 sm:w-40" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-2/3 rounded bg-slate-200/60 dark:bg-slate-800/60" />
                    <div className="h-3 w-1/3 rounded bg-slate-100/60 dark:bg-slate-800/40" />
                    <div className="h-5 w-1/2 rounded bg-slate-100/60 dark:bg-slate-800/40" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-panel rounded-3xl border border-rose-200/70 px-6 py-12 text-center dark:border-rose-500/30">
              <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                楽曲データを読み込めませんでした
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {error}
              </p>
              <button
                type="button"
                onClick={reload}
                className="glass-accent-button mx-auto mt-4 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black"
              >
                <ResetIcon className="h-3.5 w-3.5" />
                再読み込み
              </button>
            </div>
          ) : availableSongs.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="space-y-3">
                {visibleSongs.map((song) => {
                  const recommendation = recommendationById.get(song.id);
                  return (
                    <SongCard
                      key={song.id}
                      song={song}
                      match={
                        isFilterMode || !recommendation
                          ? undefined
                          : {
                              score: recommendation.matchScore,
                              matchedTags: recommendation.matchedTags,
                            }
                      }
                      isSeed={isSeed(song.id)}
                      isInMyList={isInMyList(song.id)}
                      isPlaying={playerSong?.id === song.id}
                      onAddSeed={handleAddSeed}
                      onToggleMyList={toggleMyList}
                      onPlay={handlePlay}
                    />
                  );
                })}
              </div>

              {remainingCount > 0 && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="glass-neutral rounded-xl px-5 py-2.5 text-xs font-black"
                  >
                    もっと見る（残り {remainingCount.toLocaleString('ja-JP')}曲）
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="border-t border-slate-200/70 py-6 dark:border-slate-800/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>VocaDig — Phase 8: にじみなしクリアアクリルUI × 8色推しカラーテーマ</p>
          <p>データ出典: VocaDB (https://vocadb.net)</p>
        </div>
      </footer>

      <MiniPlayer
        song={playerSong}
        isSeed={playerSong ? isSeed(playerSong.id) : false}
        isInMyList={playerSong ? isInMyList(playerSong.id) : false}
        onClose={handleClosePlayer}
        onAddSeed={handleAddSeed}
        onToggleMyList={toggleMyList}
      />

      <MyListModal
        open={myListOpen}
        songs={myList}
        isSeed={isSeed}
        onClose={() => setMyListOpen(false)}
        onRemove={removeFromMyList}
        onAddSeed={handleAddSeed}
        onPlay={(song) => {
          handlePlay(song);
          setMyListOpen(false);
        }}
        onSeedAll={handleSeedMyList}
        onClear={clearMyList}
      />
    </div>
  );
}

export default App;
