import type { SearchFilterState } from '../types/song';

/** BPMスライダーの下限 */
export const BPM_MIN = 60;
/** BPMスライダーの上限（収録曲の最大BPMをカバーする） */
export const BPM_MAX = 320;

export const DEFAULT_FILTER: SearchFilterState = {
  keyword: '',
  selectedTags: [],
  tagMatchMode: 'OR',
  selectedVoicebanks: [],
  bpmRange: [BPM_MIN, BPM_MAX],
  includeUnknownBpm: true,
  sortBy: 'popular',
};

export const SORT_OPTIONS: {
  value: SearchFilterState['sortBy'];
  label: string;
}[] = [
  { value: 'popular', label: '人気順' },
  { value: 'newest', label: '新着順' },
  { value: 'hidden_gem', label: '隠れた名曲優先' },
  { value: 'bpm_asc', label: 'BPM 低 → 高' },
  { value: 'bpm_desc', label: 'BPM 高 → 低' },
  { value: 'random', label: 'ランダム' },
];
