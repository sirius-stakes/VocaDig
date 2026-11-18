import { VOICEBANK_BY_ID } from '../constants/masterData';
import { BPM_MAX, BPM_MIN, DEFAULT_FILTER, SORT_OPTIONS } from '../constants/search';
import type { AppMode, SearchFilterState } from '../types/song';
import { normalizeTagName } from './vocadbMapper';

function parseBpm(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, parsed));
}

function parseTags(value: string | null): string[] {
  if (!value) return [];
  const tags = value
    .split(',')
    .map((tag) => normalizeTagName(tag))
    .filter(Boolean);
  return [...new Set(tags)].slice(0, 20);
}

function parseVoicebanks(value: string | null): number[] {
  if (!value) return [];
  const ids = value
    .split(',')
    .map((entry) => Number.parseInt(entry, 10))
    .filter((id) => Number.isInteger(id) && VOICEBANK_BY_ID.has(id));
  return [...new Set(ids)];
}

/** URLのクエリ文字列から Filter Dig の条件を復元する */
export function readFilterFromUrl(search: string): SearchFilterState {
  const params = new URLSearchParams(search);

  const bpmMin = parseBpm(params.get('bpmMin'), DEFAULT_FILTER.bpmRange[0]);
  const bpmMax = parseBpm(params.get('bpmMax'), DEFAULT_FILTER.bpmRange[1]);
  const sortParam = params.get('sort');

  return {
    keyword: params.get('q') ?? '',
    selectedTags: parseTags(params.get('tags')),
    tagMatchMode: params.get('tagMode') === 'and' ? 'AND' : 'OR',
    selectedVoicebanks: parseVoicebanks(params.get('voicebanks')),
    bpmRange: bpmMin <= bpmMax ? [bpmMin, bpmMax] : [bpmMax, bpmMin],
    includeUnknownBpm: params.get('unknownBpm') !== '0',
    sortBy:
      SORT_OPTIONS.find((option) => option.value === sortParam)?.value ??
      DEFAULT_FILTER.sortBy,
  };
}

/** URLのクエリ文字列から表示モードを復元する */
export function readModeFromUrl(search: string): AppMode {
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'similar' ? 'similar_recommend' : 'filter_dig';
}

/** 現在のモードと検索条件をURLのクエリ文字列へ変換する */
export function buildSearchParams(
  mode: AppMode,
  filter: SearchFilterState,
): URLSearchParams {
  const params = new URLSearchParams();

  if (mode === 'similar_recommend') params.set('mode', 'similar');
  if (filter.keyword.trim()) params.set('q', filter.keyword.trim());
  if (filter.selectedTags.length > 0) {
    params.set('tags', filter.selectedTags.join(','));
  }
  if (filter.tagMatchMode === 'AND') params.set('tagMode', 'and');
  if (filter.selectedVoicebanks.length > 0) {
    params.set('voicebanks', filter.selectedVoicebanks.join(','));
  }
  if (filter.bpmRange[0] !== BPM_MIN) {
    params.set('bpmMin', String(filter.bpmRange[0]));
  }
  if (filter.bpmRange[1] !== BPM_MAX) {
    params.set('bpmMax', String(filter.bpmRange[1]));
  }
  if (!filter.includeUnknownBpm) params.set('unknownBpm', '0');
  if (filter.sortBy !== DEFAULT_FILTER.sortBy) {
    params.set('sort', filter.sortBy);
  }

  return params;
}

/** 検索条件をURLへ反映する（ブラウザ履歴は増やさない） */
export function syncUrlWithFilters(
  mode: AppMode,
  filter: SearchFilterState,
): void {
  if (typeof window === 'undefined') return;
  const params = buildSearchParams(mode, filter);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(null, '', nextUrl);
}
