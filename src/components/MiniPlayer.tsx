import { useEffect, useState } from 'react';
import type { VocaSong } from '../types/song';
import { formatBpm } from '../utils/format';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  HeartIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
  XIcon,
} from './icons';

interface MiniPlayerProps {
  song: VocaSong | null;
  isSeed: boolean;
  isInMyList: boolean;
  onClose: () => void;
  onAddSeed: (song: VocaSong) => void;
  onToggleMyList: (song: VocaSong) => void;
}

/** YouTube PV を埋め込み再生できる URL を組み立てる */
function buildEmbedUrl(pvId: string): string {
  return `https://www.youtube-nocookie.com/embed/${pvId}?autoplay=1&rel=0`;
}

export function MiniPlayer({
  song,
  isSeed,
  isInMyList,
  onClose,
  onAddSeed,
  onToggleMyList,
}: MiniPlayerProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!song) {
      setExpanded(false);
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, onClose]);

  if (!song) return null;

  const youtubePv = song.pvs.find((pv) => pv.service === 'Youtube');
  const nicoPv = song.pvs.find((pv) => pv.service === 'NicoNicoDouga');
  const producerText =
    song.producers.slice(0, 2).join(' / ') ||
    song.artistString ||
    'アーティスト不明';

  return (
    <>
      {/* 固定プレイヤーにコンテンツが隠れないよう、通常フローに余白を確保する */}
      <div
        aria-hidden="true"
        className={`transition-[height] duration-300 ${
          expanded ? 'h-44 sm:h-64' : 'h-36 sm:h-32'
        }`}
      />

      <div
        role="region"
        aria-label="試聴ミニプレイヤー"
        className="animate-mini-player-in fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/75 shadow-[0_-8px_30px_rgb(15_23_42/0.12)] backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-900/70"
      >
        <div
          aria-hidden="true"
          className="glass-accent-bar h-1 w-full"
        />

        <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-start gap-3">
            <div
              className={`relative shrink-0 overflow-hidden rounded-xl bg-slate-950 transition-all duration-300 ${
                expanded
                  ? 'aspect-video w-40 sm:w-72'
                  : 'aspect-video w-24 sm:w-40'
              }`}
            >
              {youtubePv ? (
                <iframe
                  key={`${song.id}-${youtubePv.pvId}`}
                  src={buildEmbedUrl(youtubePv.pvId)}
                  title={`${song.title} の試聴`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : nicoPv ? (
                <a
                  href={nicoPv.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-full w-full"
                  aria-label={`${song.title}をニコニコ動画で開く`}
                >
                  <img
                    src={nicoPv.thumbUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden';
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-950/40 transition group-hover:bg-slate-950/60">
                    <PlayIcon className="h-6 w-6 text-white drop-shadow" />
                  </span>
                </a>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <MusicIcon className="h-6 w-6 text-slate-600" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="glass-accent-text flex items-center gap-1.5 text-[9px] font-black tracking-[0.18em]">
                    <span className="flex items-end gap-0.5" aria-hidden="true">
                      <span className="h-1.5 w-0.5 animate-pulse rounded-full bg-cyan-500 dark:bg-cyan-400" />
                      <span className="h-2.5 w-0.5 animate-pulse rounded-full bg-teal-500 dark:bg-teal-400 [animation-delay:120ms]" />
                      <span className="h-2 w-0.5 animate-pulse rounded-full bg-cyan-400 dark:bg-cyan-300 [animation-delay:240ms]" />
                    </span>
                    NOW DIGGING
                  </p>
                  <h2 className="mt-0.5 line-clamp-1 text-xs font-black tracking-tight sm:text-sm">
                    {song.title}
                  </h2>
                  <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                    {producerText}
                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                      ·
                    </span>
                    BPM {formatBpm(song.bpm)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setExpanded((current) => !current)}
                    aria-expanded={expanded}
                    aria-label={
                      expanded
                        ? 'プレイヤーをコンパクト表示にする'
                        : 'プレイヤーを展開表示にする'
                    }
                    title={expanded ? 'コンパクト表示' : '展開表示'}
                    className="glass-neutral flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    {expanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronUpIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="ミニプレイヤーを閉じる"
                    title="閉じる"
                    className="glass-neutral flex h-8 w-8 items-center justify-center rounded-lg"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAddSeed(song)}
                  disabled={isSeed}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold sm:text-[11px] ${
                    isSeed
                      ? 'cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 backdrop-blur-sm dark:text-emerald-400'
                      : 'glass-neutral'
                  }`}
                >
                  {isSeed ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : (
                    <PlusIcon className="h-3 w-3" />
                  )}
                  {isSeed ? '追加済み' : '推薦基準に追加'}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleMyList(song)}
                  aria-pressed={isInMyList}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold sm:text-[11px] ${
                    isInMyList
                      ? 'glass-accent-chip'
                      : 'glass-neutral'
                  }`}
                >
                  <HeartIcon filled={isInMyList} className="h-3 w-3" />
                  {isInMyList ? 'マイリスト済み' : 'マイリスト保存'}
                </button>

                {!youtubePv && nicoPv && (
                  <a
                    href={nicoPv.url}
                    target="_blank"
                    rel="noreferrer"
                    className="glass-accent-button flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black sm:text-[11px]"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    ニコニコ動画で開く
                  </a>
                )}

                <a
                  href={song.vocadbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto hidden items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-cyan-600 dark:hover:text-cyan-400 sm:flex"
                >
                  VocaDB
                  <ExternalLinkIcon className="h-2.5 w-2.5" />
                </a>
              </div>

              {expanded && (
                <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
                  {song.tags.slice(0, 10).map((tag) => (
                    <span
                      key={tag}
                      title={tag}
                      className="max-w-[10rem] truncate rounded-full bg-slate-100/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
