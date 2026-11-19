import { useEffect, useRef, useState } from 'react';
import { VOICEBANK_BY_ID } from '../constants/masterData';
import {
  buildMyListText,
  downloadMyListJson,
} from '../hooks/useMyList';
import type { VocaSong } from '../types/song';
import { formatBpm, tagDisplayName } from '../utils/format';
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  HeartIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from './icons';

interface MyListModalProps {
  open: boolean;
  songs: VocaSong[];
  isSeed: (songId: number) => boolean;
  onClose: () => void;
  onRemove: (songId: number) => void;
  onAddSeed: (song: VocaSong) => void;
  onPlay: (song: VocaSong) => void;
  onSeedAll: () => void;
  onClear: () => void;
}

type StatusKind = 'copied' | 'copy_failed' | 'exported';

function songArtist(song: VocaSong): string {
  return (
    song.producers.slice(0, 2).join(' / ') ||
    song.artistString ||
    'アーティスト不明'
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // クリップボードAPIが使えない場合はフォールバックへ
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function MyListModal({
  open,
  songs,
  isSeed,
  onClose,
  onRemove,
  onAddSeed,
  onPlay,
  onSeedAll,
  onClear,
}: MyListModalProps) {
  const [status, setStatus] = useState<StatusKind | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(
    () => () => {
      if (statusTimerRef.current !== undefined) {
        clearTimeout(statusTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) setStatus(null);
  }, [open]);

  if (!open) return null;

  const showStatus = (next: StatusKind) => {
    setStatus(next);
    if (statusTimerRef.current !== undefined) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => setStatus(null), 2400);
  };

  const handleCopy = async () => {
    if (songs.length === 0) return;
    const copied = await copyText(buildMyListText(songs));
    showStatus(copied ? 'copied' : 'copy_failed');
  };

  const handleExport = () => {
    if (songs.length === 0) return;
    downloadMyListJson(songs);
    showStatus('exported');
  };

  const pendingSeedCount = songs.filter((song) => !isSeed(song.id)).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="マイリスト"
    >
      <button
        type="button"
        aria-label="マイリストを閉じる"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-lg tint-shadow">
              <HeartIcon filled className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-black sm:text-base">マイリスト</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {songs.length}曲を保存中 · この端末のlocalStorageに保存されます
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {songs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/60 sm:px-5">
            <button
              type="button"
              onClick={onSeedAll}
              disabled={songs.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-[11px] font-black text-white shadow-md tint-shadow transition hover:from-violet-600 hover:to-fuchsia-600"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              まとめて推薦基準に追加
              {pendingSeedCount > 0 && (
                <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] tabular-nums">
                  +{pendingSeedCount}
                </span>
              )}
            </button>
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              マイリストの曲から類似曲レコメンドへ移行します
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {songs.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl tint-bg">
                <HeartIcon className="h-7 w-7 text-fuchsia-600 dark:text-fuchsia-400" />
              </div>
              <p className="mt-4 text-sm font-bold">マイリストは空です</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                楽曲カードやミニプレイヤーの「♡ マイリスト」から、気になる曲を保存できます。
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {songs.map((song) => {
                const added = isSeed(song.id);
                const voicebank = VOICEBANK_BY_ID.get(song.voicebanks[0]);
                const primaryPv = song.pvs[0];
                return (
                  <li
                    key={song.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-fuchsia-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:tint-border"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {primaryPv ? (
                            <img
                              src={primaryPv.thumbUrl}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={(event) => {
                                event.currentTarget.style.visibility = 'hidden';
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <MusicIcon className="h-4 w-4 text-slate-400" />
                          )}
                          {primaryPv && (
                            <button
                              type="button"
                              onClick={() => onPlay(song)}
                              aria-label={`${song.title}を試聴`}
                              className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white opacity-0 transition hover:bg-slate-950/55 focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-bold leading-snug">
                            {song.title}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {songArtist(song)}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
                            {song.vocadbUrl}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(song.id)}
                        aria-label={`${song.title}をマイリストから削除`}
                        className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <span className="rounded tint-bg px-1.5 py-0.5 text-[10px] font-black text-teal-700 dark:text-teal-300">
                        BPM {formatBpm(song.bpm)}
                      </span>
                      {voicebank && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                          style={{ backgroundColor: `${voicebank.color}1f` }}
                        >
                          {voicebank.name}
                        </span>
                      )}
                      {song.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          title={tag}
                          className="max-w-[8rem] truncate rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                          {tagDisplayName(tag)}
                        </span>
                      ))}
                      <a
                        href={song.vocadbUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400"
                      >
                        VocaDB
                        <ExternalLinkIcon className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPlay(song)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-300 px-2 py-1.5 text-[11px] font-bold text-cyan-600 transition hover:tint-bg dark:tint-border dark:text-cyan-300"
                      >
                        <PlayIcon className="h-3 w-3" />
                        試聴
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddSeed(song)}
                        disabled={added}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition ${
                          added
                            ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-violet-300 text-violet-600 hover:tint-bg dark:tint-border dark:text-violet-300'
                        }`}
                      >
                        {added ? (
                          <CheckIcon className="h-3 w-3" />
                        ) : (
                          <PlusIcon className="h-3 w-3" />
                        )}
                        {added ? '追加済み' : '推薦基準に追加'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={songs.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              テキストコピー
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={songs.length === 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-cyan-500 dark:hover:text-cyan-400"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              JSONエクスポート
            </button>

            {songs.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-rose-500/60 dark:hover:text-rose-400"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                すべて削除
              </button>
            )}
          </div>

          <p
            aria-live="polite"
            className={`mt-2 min-h-[1rem] text-[10px] font-semibold ${
              status === 'copy_failed'
                ? 'text-rose-500'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {status === 'copied' &&
              '曲名 / アーティスト / URL をテキストでコピーしました'}
            {status === 'copy_failed' &&
              'クリップボードにコピーできませんでした。ブラウザの権限をご確認ください。'}
            {status === 'exported' &&
              'マイリストをJSONファイルとして書き出しました'}
          </p>
        </div>
      </div>
    </div>
  );
}
