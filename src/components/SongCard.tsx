import { useState } from 'react';
import { VOICEBANK_BY_ID } from '../constants/masterData';
import type { VocaSong, Voicebank } from '../types/song';
import { formatBpm, formatDuration, tagDisplayName } from '../utils/format';
import {
  CheckIcon,
  ExternalLinkIcon,
  HeartIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
} from './icons';

interface SongCardProps {
  song: VocaSong;
  match?: { score: number; matchedTags: string[] };
  isSeed: boolean;
  isInMyList: boolean;
  isPlaying?: boolean;
  onAddSeed: (song: VocaSong) => void;
  onToggleMyList: (song: VocaSong) => void;
  onPlay: (song: VocaSong) => void;
}

export function SongCard({
  song,
  match,
  isSeed,
  isInMyList,
  isPlaying = false,
  onAddSeed,
  onToggleMyList,
  onPlay,
}: SongCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const primaryPv = song.pvs[0];
  const resolvedVoicebanks = song.voicebanks
    .map((id) => VOICEBANK_BY_ID.get(id))
    .filter((voicebank): voicebank is Voicebank => voicebank !== undefined);
  const voicebanks = resolvedVoicebanks.slice(0, 2);
  const extraVoicebankCount = Math.max(resolvedVoicebanks.length - 2, 0);

  const matchedTags = match?.matchedTags ?? [];
  const matchedSet = new Set(matchedTags);
  const displayTags = [
    ...matchedTags,
    ...song.tags.filter((tag) => !matchedSet.has(tag)),
  ].slice(0, 6);

  return (
    <article className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-cyan-300 hover:shadow-lg hover:tint-shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-700 sm:gap-4 sm:p-4">
      <div className="relative aspect-video w-28 shrink-0 self-start overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-950 sm:w-40">
        {primaryPv && !imageFailed ? (
          <img
            src={primaryPv.thumbUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MusicIcon className="h-7 w-7 text-slate-400 dark:text-slate-600" />
          </div>
        )}

        {match && (
          <span className="absolute left-1.5 top-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-black text-white shadow-lg tint-shadow">
            マッチ {Math.round(match.score)}%
          </span>
        )}

        {song.lengthSeconds > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-white">
            {formatDuration(song.lengthSeconds)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-black leading-snug tracking-tight text-slate-900 dark:text-slate-50">
              {song.title}
            </h3>
            <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {song.producers.slice(0, 2).join(' / ') ||
                song.artistString ||
                'アーティスト不明'}
            </p>
          </div>
          <a
            href={song.vocadbUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${song.title}をVocaDBで開く`}
            title="VocaDBで開く"
            className="shrink-0 rounded-lg p-1 text-slate-300 transition hover:tint-bg hover:text-cyan-500 dark:text-slate-600 dark:hover:text-cyan-400"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
              song.bpm !== null
                ? 'tint-bg text-teal-700 dark:tint-bg dark:text-teal-300'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            BPM {formatBpm(song.bpm)}
          </span>
          {voicebanks.map((voicebank) => (
            <span
              key={voicebank.id}
              className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-200"
              style={{
                borderColor: `${voicebank.color}55`,
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
          {extraVoicebankCount > 0 && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              +{extraVoicebankCount}
            </span>
          )}
          {song.ratingScore > 0 && (
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              ★ {song.ratingScore.toLocaleString('ja-JP')}
            </span>
          )}
        </div>

        {match && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              role="progressbar"
              aria-label="レコメンドのマッチ度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(match.score)}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                style={{
                  width: `${Math.min(100, Math.max(0, match.score))}%`,
                }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-black tabular-nums text-cyan-700 dark:text-cyan-300">
              {Math.round(match.score)}%
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {displayTags.map((tag) => {
            const matched = matchedSet.has(tag);
            return (
              <span
                key={tag}
                title={tag}
                className={`max-w-[11rem] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  matched
                    ? 'tint-bg text-violet-700 ring-1 tint-ring dark:tint-bg-strong dark:text-violet-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                }`}
              >
                {tagDisplayName(tag)}
              </span>
            );
          })}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
          {primaryPv ? (
            <button
              type="button"
              onClick={() => onPlay(song)}
              aria-label={`${song.title}を試聴`}
              aria-pressed={isPlaying}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black shadow-sm transition ${
                isPlaying
                  ? 'bg-teal-600 text-white tint-shadow hover:bg-teal-700'
                  : 'bg-cyan-500 text-white tint-shadow hover:bg-cyan-600'
              }`}
            >
              <PlayIcon className="h-3 w-3" />
              {isPlaying ? '再生中' : '試聴'}
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <PlayIcon className="h-3 w-3" />
              PVなし
            </span>
          )}

          <button
            type="button"
            onClick={() => onAddSeed(song)}
            disabled={isSeed}
            aria-label={
              isSeed
                ? `${song.title}は推薦基準に追加済み`
                : `${song.title}を推薦基準に追加`
            }
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
              isSeed
                ? 'cursor-default border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300'
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
            aria-label={
              isInMyList
                ? `${song.title}をマイリストから削除`
                : `${song.title}をマイリストに追加`
            }
            className={`ml-auto flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
              isInMyList
                ? 'border-fuchsia-400 tint-bg text-fuchsia-600 dark:tint-border-strong dark:text-fuchsia-400'
                : 'border-slate-200 text-slate-500 hover:border-fuchsia-300 hover:text-fuchsia-500 dark:border-slate-700 dark:text-slate-400 dark:hover:tint-border-strong dark:hover:text-fuchsia-400'
            }`}
          >
            <HeartIcon filled={isInMyList} className="h-3 w-3" />
            <span className="hidden sm:inline">マイリスト</span>
          </button>
        </div>
      </div>
    </article>
  );
}
