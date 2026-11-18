import { useEffect, useMemo, useRef, useState } from 'react';
import { VOICEBANK_BY_ID } from '../constants/masterData';
import type { TasteProfile, VocaSong } from '../types/song';
import { formatBpm, formatCount, tagDisplayName } from '../utils/format';
import {
  cancelVocaDbSearch,
  isVocaDbAbortError,
  searchVocaDbSongsDebounced,
} from '../utils/vocadbApi';
import {
  CheckIcon,
  ExternalLinkIcon,
  MusicIcon,
  PlusIcon,
  ResetIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from './icons';

interface SeedRecommendSidebarProps {
  allSongs: VocaSong[];
  seeds: VocaSong[];
  profile: TasteProfile | null;
  voicebankBonus: boolean;
  onToggleVoicebankBonus: () => void;
  onAddSeed: (song: VocaSong) => void;
  onRemoveSeed: (songId: number) => void;
  onClearSeeds: () => void;
}

const sectionClass =
  'rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
const sectionTitleClass =
  'text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400';

function matchesQuery(song: VocaSong, query: string): boolean {
  const haystack = [
    song.title,
    song.artistString,
    ...song.producers,
    ...song.tags,
  ]
    .join('\n')
    .toLowerCase();
  return haystack.includes(query);
}

function SongSearchRow({
  song,
  added,
  source,
  onAdd,
}: {
  song: VocaSong;
  added: boolean;
  source?: 'vocadb';
  onAdd: (song: VocaSong) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(song)}
      disabled={added}
      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition ${
        added
          ? 'cursor-default bg-slate-100/60 opacity-70 dark:bg-slate-800/40'
          : 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
          {song.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
          {song.producers.slice(0, 2).join(' / ') ||
            song.artistString ||
            'アーティスト不明'}
          <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
          BPM {formatBpm(song.bpm)}
          {source === 'vocadb' && (
            <span className="ml-1.5 rounded bg-violet-500/15 px-1 py-0.5 text-[9px] font-black text-violet-600 dark:text-violet-300">
              VocaDB
            </span>
          )}
        </p>
      </div>
      {added ? (
        <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <PlusIcon className="h-4 w-4 shrink-0 text-cyan-500" />
      )}
    </button>
  );
}

export function SeedRecommendSidebar({
  allSongs,
  seeds,
  profile,
  voicebankBonus,
  onToggleVoicebankBonus,
  onAddSeed,
  onRemoveSeed,
  onClearSeeds,
}: SeedRecommendSidebarProps) {
  const [query, setQuery] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<VocaSong[]>([]);
  const [apiSearched, setApiSearched] = useState(false);
  const requestIdRef = useRef(0);

  const seedIds = useMemo(() => new Set(seeds.map((song) => song.id)), [seeds]);

  const localResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return allSongs
      .filter(
        (song) => !seedIds.has(song.id) && matchesQuery(song, normalized),
      )
      .slice(0, 6);
  }, [allSongs, query, seedIds]);

  // 検索語を変えたら、前回のVocaDB結果と進行中の検索を破棄する
  useEffect(() => {
    requestIdRef.current += 1;
    cancelVocaDbSearch();
    setApiLoading(false);
    setApiError(null);
    setApiResults([]);
    setApiSearched(false);
  }, [query]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      cancelVocaDbSearch();
    },
    [],
  );

  const handleVocaDbSearch = async () => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setApiError('VocaDB検索は2文字以上で入力してください。');
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setApiLoading(true);
    setApiError(null);
    setApiResults([]);
    setApiSearched(false);

    try {
      const results = await searchVocaDbSongsDebounced(normalized);
      if (requestIdRef.current !== requestId) return;
      setApiResults(results);
      setApiSearched(true);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      if (isVocaDbAbortError(error)) return;
      setApiError(
        error instanceof Error
          ? error.message
          : 'VocaDB検索に失敗しました。',
      );
    } finally {
      if (requestIdRef.current === requestId) setApiLoading(false);
    }
  };

  const trimmedQuery = query.trim();
  const topTags = profile?.topTags.slice(0, 8) ?? [];
  const maxTagWeight = topTags[0]?.weight ?? 1;
  const preferredVoicebanks =
    profile?.preferredVoicebanks
      .map((id) => VOICEBANK_BY_ID.get(id))
      .filter((voicebank) => voicebank !== undefined) ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black tracking-[0.22em] text-violet-600 dark:text-violet-400">
            LIKE-TO-DIG
          </p>
          <h2 className="text-lg font-black tracking-tight">好きな曲から推薦</h2>
        </div>
        {seeds.length > 0 && (
          <button
            type="button"
            onClick={onClearSeeds}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-800 dark:text-slate-400 dark:hover:border-rose-500/60 dark:hover:text-rose-400"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            クリア
          </button>
        )}
      </div>

      <section className={sectionClass}>
        <label htmlFor="seed-search" className={sectionTitleClass}>
          シード曲を検索
        </label>
        <div className="relative mt-2">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="seed-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleVocaDbSearch();
              }
            }}
            placeholder="曲名・P名で検索"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-500"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleVocaDbSearch()}
          disabled={apiLoading || trimmedQuery.length === 0}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-[11px] font-black text-white shadow-md shadow-violet-500/20 transition hover:from-violet-600 hover:to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {apiLoading ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              VocaDBを検索中...
            </>
          ) : (
            <>
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              VocaDB全体から検索
            </>
          )}
        </button>
        <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          600msのデバウンス＋キャッシュでレート制限に配慮しています。
        </p>

        {trimmedQuery && (
          <div className="mt-3">
            <p className="px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">
              ローカルデータから検索
            </p>
            {localResults.length > 0 ? (
              <div className="mt-1">
                {localResults.map((song) => (
                  <SongSearchRow
                    key={song.id}
                    song={song}
                    added={seedIds.has(song.id)}
                    onAdd={onAddSeed}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                ローカルに該当曲がありません。上のボタンからVocaDB全体を検索できます。
              </p>
            )}
          </div>
        )}

        {apiLoading && (
          <div className="mt-3 space-y-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {apiError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {apiError}
          </p>
        )}

        {!apiLoading && apiResults.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-violet-600 dark:text-violet-300">
                VocaDB検索結果
              </p>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {formatCount(apiResults.length)}件
              </span>
            </div>
            <div className="mt-1">
              {apiResults.map((song) => (
                <SongSearchRow
                  key={`vocadb-${song.id}`}
                  song={song}
                  added={seedIds.has(song.id)}
                  source="vocadb"
                  onAdd={onAddSeed}
                />
              ))}
            </div>
          </div>
        )}

        {!apiLoading &&
          !apiError &&
          apiSearched &&
          apiResults.length === 0 && (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              VocaDBでも該当曲が見つかりませんでした。表記を変えて試してください。
            </p>
          )}
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <p className={sectionTitleClass}>選択中のシード曲</p>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-black text-violet-600 dark:text-violet-300">
            {seeds.length}曲
          </span>
        </div>

        {seeds.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center dark:border-slate-700">
            <MusicIcon className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              好きな曲を1曲以上追加してください
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
              曲のタグとBPMから、似た雰囲気の曲をスコアリングします。
            </p>
          </div>
        ) : (
          <ul className="mt-2 space-y-2">
            {seeds.map((song) => (
              <li
                key={song.id}
                className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{song.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                      {song.producers.slice(0, 2).join(' / ') ||
                        song.artistString ||
                        'アーティスト不明'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveSeed(song.id)}
                    aria-label={`${song.title}をシード曲から削除`}
                    className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-black text-teal-700 dark:text-teal-300">
                    BPM {formatBpm(song.bpm)}
                  </span>
                  {song.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      title={tag}
                      className="max-w-[9rem] truncate rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tagDisplayName(tag)}
                    </span>
                  ))}
                  <a
                    href={song.vocadbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 transition hover:text-cyan-500"
                  >
                    VocaDB
                    <ExternalLinkIcon className="h-2.5 w-2.5" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile && seeds.length > 0 && (
        <section className={sectionClass}>
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="h-3.5 w-3.5 text-violet-500" />
            <p className={sectionTitleClass}>あなたの好みプロファイル</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                平均BPM
              </p>
              <p className="text-lg font-black tabular-nums text-teal-600 dark:text-teal-400">
                {profile.averageBpm ?? '---'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                特徴タグ
              </p>
              <p className="text-lg font-black tabular-nums text-violet-600 dark:text-violet-400">
                {profile.topTags.length}
              </p>
            </div>
          </div>

          {topTags.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              {topTags.map((entry) => (
                <div key={entry.tag}>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate font-bold text-slate-600 dark:text-slate-300">
                      {tagDisplayName(entry.tag)}
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-400 dark:text-slate-500">
                      ×{entry.count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{
                        width: `${Math.max(
                          6,
                          (entry.weight / maxTagWeight) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
              シード曲に特徴タグがありません。
            </p>
          )}

          {preferredVoicebanks.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                よく聴く音声ライブラリ
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {preferredVoicebanks.map((voicebank) => (
                  <span
                    key={voicebank.id}
                    className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                    style={{
                      borderColor: `${voicebank.color}66`,
                      backgroundColor: `${voicebank.color}18`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: voicebank.color }}
                    />
                    {voicebank.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
            <div>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                音声ライブラリ一致ボーナス
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                同じライブラリの曲に +8点
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={voicebankBonus}
              aria-label="音声ライブラリ一致ボーナス"
              onClick={onToggleVoicebankBonus}
              className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                voicebankBonus
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  voicebankBonus ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </section>
      )}

      {seeds.length === 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <ResetIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
            シード曲を追加すると、共通タグ（2.5倍重み）・平均BPM・音声ライブラリから類似度を自動計算します。
          </p>
        </div>
      )}
    </div>
  );
}
