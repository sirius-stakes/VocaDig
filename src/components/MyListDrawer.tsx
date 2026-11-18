import { VOICEBANK_BY_ID } from '../constants/masterData';
import type { VocaSong } from '../types/song';
import { formatBpm, tagDisplayName } from '../utils/format';
import {
  CheckIcon,
  ExternalLinkIcon,
  HeartIcon,
  MusicIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from './icons';

interface MyListDrawerProps {
  open: boolean;
  songs: VocaSong[];
  isSeed: (songId: number) => boolean;
  onClose: () => void;
  onRemove: (songId: number) => void;
  onAddSeed: (song: VocaSong) => void;
  onClear: () => void;
}

export function MyListDrawer({
  open,
  songs,
  isSeed,
  onClose,
  onRemove,
  onAddSeed,
  onClear,
}: MyListDrawerProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="マイリスト"
    >
      <button
        type="button"
        aria-label="マイリストを閉じる"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-sm"
      />

      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-md shadow-fuchsia-500/25">
              <HeartIcon filled className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black">マイリスト</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {songs.length}曲を保存中
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {songs.length === 0 ? (
            <div className="mt-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/10">
                <HeartIcon className="h-7 w-7 text-fuchsia-400" />
              </div>
              <p className="mt-4 text-sm font-bold">マイリストは空です</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                楽曲カードの「♡ マイリスト」から気になる曲を保存できます。
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {songs.map((song) => {
                const added = isSeed(song.id);
                const voicebank = VOICEBANK_BY_ID.get(song.voicebanks[0]);
                return (
                  <li
                    key={song.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {song.pvs[0] ? (
                            <img
                              src={song.pvs[0].thumbUrl}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(event) => {
                                event.currentTarget.style.visibility = 'hidden';
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <MusicIcon className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-xs font-bold leading-snug">
                            {song.title}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
                            {song.producers.slice(0, 2).join(' / ') ||
                              song.artistString ||
                              'アーティスト不明'}
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
                      <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-black text-teal-700 dark:text-teal-300">
                        BPM {formatBpm(song.bpm)}
                      </span>
                      {voicebank && (
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
                          style={{
                            backgroundColor: `${voicebank.color}1f`,
                          }}
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
                        className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 transition hover:text-cyan-500"
                      >
                        VocaDB
                        <ExternalLinkIcon className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAddSeed(song)}
                      disabled={added}
                      className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition ${
                        added
                          ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-violet-300 text-violet-600 hover:bg-violet-500/10 dark:border-violet-500/40 dark:text-violet-300'
                      }`}
                    >
                      {added ? (
                        <CheckIcon className="h-3 w-3" />
                      ) : (
                        <PlusIcon className="h-3 w-3" />
                      )}
                      {added ? '推薦基準に追加済み' : '推薦基準に追加'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {songs.length > 0 && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClear}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-rose-500/60 dark:hover:text-rose-400"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              マイリストをすべて削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
