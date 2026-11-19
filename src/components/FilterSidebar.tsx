import { CURATED_TAGS, VOICEBANKS } from '../constants/masterData';
import { BPM_MAX, BPM_MIN } from '../constants/search';
import type { SearchFilterState, TagCategory } from '../types/song';
import { normalizeTagName } from '../utils/vocadbMapper';
import { ResetIcon, SearchIcon } from './icons';

interface FilterSidebarProps {
  value: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
  onReset: () => void;
  matchedCount: number;
  totalCount: number;
}

const CATEGORY_ORDER: { category: TagCategory; label: string; hint: string }[] = [
  { category: 'mood', label: 'ムード', hint: '感情・雰囲気' },
  { category: 'genre', label: 'ジャンル', hint: '音楽性' },
  { category: 'instrument', label: '楽器', hint: '音色' },
  { category: 'tempo_style', label: 'テンポ・スタイル', hint: 'ノリ・構成' },
];

const sectionClass = 'glass-panel rounded-2xl p-4';
const sectionTitleClass =
  'text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400';

function bpmPercent(value: number): number {
  return ((value - BPM_MIN) / (BPM_MAX - BPM_MIN)) * 100;
}

export function FilterSidebar({
  value,
  onChange,
  onReset,
  matchedCount,
  totalCount,
}: FilterSidebarProps) {
  const toggleTag = (enName: string) => {
    const normalized = normalizeTagName(enName);
    const exists = value.selectedTags.some(
      (tag) => normalizeTagName(tag) === normalized,
    );
    onChange({
      ...value,
      selectedTags: exists
        ? value.selectedTags.filter(
            (tag) => normalizeTagName(tag) !== normalized,
          )
        : [...value.selectedTags, normalized],
    });
  };

  const toggleVoicebank = (voicebankId: number) => {
    const exists = value.selectedVoicebanks.includes(voicebankId);
    onChange({
      ...value,
      selectedVoicebanks: exists
        ? value.selectedVoicebanks.filter((id) => id !== voicebankId)
        : [...value.selectedVoicebanks, voicebankId],
    });
  };

  const updateBpmMin = (next: number) => {
    const [, currentMax] = value.bpmRange;
    const min = Math.max(BPM_MIN, Math.min(next, currentMax));
    onChange({ ...value, bpmRange: [min, currentMax] });
  };

  const updateBpmMax = (next: number) => {
    const [currentMin] = value.bpmRange;
    const max = Math.min(BPM_MAX, Math.max(next, currentMin));
    onChange({ ...value, bpmRange: [currentMin, max] });
  };

  const leftPercent = bpmPercent(value.bpmRange[0]);
  const rightPercent = bpmPercent(value.bpmRange[1]);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <p className="glass-accent-text text-[10px] font-black tracking-[0.22em]">
            FILTER DIG
          </p>
          <h2 className="text-lg font-black tracking-tight">条件でディグる</h2>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="glass-neutral flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
        >
          <ResetIcon className="h-3.5 w-3.5" />
          リセット
        </button>
      </div>

      <div className="glass-accent-chip rounded-2xl px-4 py-3">
        <p className="text-[10px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
          現在のヒット
        </p>
        <p className="glass-accent-text mt-0.5 text-2xl font-black tabular-nums">
          {matchedCount.toLocaleString('ja-JP')}
          <span className="ml-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            / {totalCount.toLocaleString('ja-JP')} 曲
          </span>
        </p>
      </div>

      <section className={sectionClass}>
        <label htmlFor="filter-keyword" className={sectionTitleClass}>
          キーワード
        </label>
        <div className="relative mt-2">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="filter-keyword"
            type="search"
            value={value.keyword}
            onChange={(event) =>
              onChange({ ...value, keyword: event.target.value })
            }
            placeholder="曲名・P名・タグで検索"
            className="glass-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={sectionTitleClass}>ムード・タグ</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              複数選択可（{value.selectedTags.length}件選択中）
            </p>
          </div>
          <div
            role="group"
            aria-label="タグの一致条件"
            className="glass-panel flex shrink-0 rounded-lg p-0.5"
          >
            {(['AND', 'OR'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChange({ ...value, tagMatchMode: mode })}
                aria-pressed={value.tagMatchMode === mode}
                className={`rounded-md px-2 py-1 text-[10px] font-black ${
                  value.tagMatchMode === mode
                    ? 'glass-acrylic-primary'
                    : 'glass-tab-inactive'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {CATEGORY_ORDER.map(({ category, label, hint }) => {
            const tags = CURATED_TAGS.filter((tag) => tag.category === category);
            if (tags.length === 0) return null;
            return (
              <div key={category}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {label}
                  </h3>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {hint}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const selected = value.selectedTags.some(
                      (entry) =>
                        normalizeTagName(entry) ===
                        normalizeTagName(tag.enName),
                    );
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.enName)}
                        aria-pressed={selected}
                        title={tag.enName}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                          selected
                            ? 'glass-accent-chip'
                            : 'glass-neutral'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <p className={sectionTitleClass}>BPMレンジ</p>
          <p className="glass-accent-chip rounded-md px-2 py-1 text-[11px] font-black tabular-nums">
            {value.bpmRange[0]} – {value.bpmRange[1]}
          </p>
        </div>

        <div className="relative mt-4 h-6">
          <div className="glass-progress-track absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full" />
          <div
            className="glass-accent-bar absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
            style={{
              left: `${leftPercent}%`,
              right: `${100 - rightPercent}%`,
            }}
          />
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            step={5}
            value={value.bpmRange[0]}
            onChange={(event) => updateBpmMin(Number(event.target.value))}
            aria-label="BPMの下限"
            className="dual-range absolute inset-0 h-6 w-full"
          />
          <input
            type="range"
            min={BPM_MIN}
            max={BPM_MAX}
            step={5}
            value={value.bpmRange[1]}
            onChange={(event) => updateBpmMax(Number(event.target.value))}
            aria-label="BPMの上限"
            className="dual-range absolute inset-0 h-6 w-full"
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          <span>{BPM_MIN}</span>
          <span>{BPM_MAX}</span>
        </div>

        <label className="glass-neutral mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold">
          <input
            type="checkbox"
            checked={value.includeUnknownBpm}
            onChange={(event) =>
              onChange({
                ...value,
                includeUnknownBpm: event.target.checked,
              })
            }
            className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-500"
          />
          <span>
            BPM未登録曲を含める
            <span className="mt-0.5 block text-[10px] font-normal text-slate-400 dark:text-slate-500">
              BPMが不明な曲も結果に表示します
            </span>
          </span>
        </label>
      </section>

      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <p className={sectionTitleClass}>音声ライブラリ</p>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            {value.selectedVoicebanks.length > 0
              ? `${value.selectedVoicebanks.length}件選択中`
              : 'すべて'}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VOICEBANKS.map((voicebank) => {
            const selected = value.selectedVoicebanks.includes(voicebank.id);
            return (
              <button
                key={voicebank.id}
                type="button"
                onClick={() => toggleVoicebank(voicebank.id)}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition ${
                  selected
                    ? 'text-slate-700 shadow-sm dark:text-slate-100'
                    : 'glass-neutral'
                }`}
                style={
                  selected
                    ? {
                        borderColor: voicebank.color,
                        backgroundColor: `${voicebank.color}22`,
                      }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: voicebank.color }}
                />
                {voicebank.name}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
