import type { VocaSong } from '../types/song';
import {
  normalizeVocaDbSong,
  type VocaDbSongContract,
} from './vocadbMapper';

const API_URL = 'https://vocadb.net/api/songs';
/** フロントエンド検索のデバウンス時間（AGENTS.md のレート制限ルール） */
export const VOCADB_DEBOUNCE_MS = 600;
const MAX_RESULTS = 15;
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;

interface SongSearchResponse {
  items?: VocaDbSongContract[];
  totalCount?: number;
}

interface CacheEntry {
  songs: VocaSong[];
  fetchedAt: number;
}

/** クエリ単位のメモリ内キャッシュ（重複リクエスト防止） */
const queryCache = new Map<string, CacheEntry>();

export class VocaDbSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VocaDbSearchError';
  }
}

export class VocaDbAbortError extends Error {
  constructor() {
    super('VocaDB検索は中断されました');
    this.name = 'VocaDbAbortError';
  }
}

function isAbortLike(error: unknown): boolean {
  if (error instanceof VocaDbAbortError) return true;
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export function isVocaDbAbortError(error: unknown): boolean {
  return isAbortLike(error);
}

export function clearVocaDbCache(): void {
  queryCache.clear();
}

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of queryCache) {
    if (now - entry.fetchedAt > CACHE_TTL_MS) queryCache.delete(key);
  }
  while (queryCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey === undefined) break;
    queryCache.delete(oldestKey);
  }
}

function buildSearchUrl(query: string): string {
  const url = new URL(API_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('fields', 'Tags,Artists,PVs,Bpm');
  url.searchParams.set('lang', 'Japanese');
  url.searchParams.set('maxResults', String(MAX_RESULTS));
  return url.toString();
}

/**
 * VocaDB 公開APIから楽曲を検索し、VocaSong 型へ正規化して返す。
 * 同一クエリはメモリキャッシュから即時返却する。
 */
export async function searchVocaDbSongs(
  query: string,
  signal?: AbortSignal,
): Promise<VocaSong[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = trimmed.toLowerCase();
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.songs;
  }

  let response: Response;
  try {
    response = await fetch(buildSearchUrl(trimmed), {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (isAbortLike(error)) throw new VocaDbAbortError();
    throw new VocaDbSearchError(
      'VocaDBに接続できませんでした。ネットワーク接続を確認してください。',
    );
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new VocaDbSearchError(
        'VocaDB APIのレート制限に達しました。しばらく待って再試行してください。',
      );
    }
    throw new VocaDbSearchError(
      `VocaDB検索に失敗しました（HTTP ${response.status}）。`,
    );
  }

  let payload: SongSearchResponse;
  try {
    payload = (await response.json()) as SongSearchResponse;
  } catch (error) {
    if (isAbortLike(error)) throw new VocaDbAbortError();
    throw new VocaDbSearchError('VocaDBのレスポンスを解析できませんでした。');
  }

  const songs = (payload.items ?? [])
    .filter((item) => typeof item?.id === 'number' && item.id > 0)
    .map((item) => normalizeVocaDbSong(item));

  queryCache.set(cacheKey, { songs, fetchedAt: Date.now() });
  pruneCache();

  return songs;
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let activeController: AbortController | null = null;
let pendingReject: ((reason?: unknown) => void) | null = null;

function rejectPending(): void {
  if (pendingReject) {
    const reject = pendingReject;
    pendingReject = null;
    reject(new VocaDbAbortError());
  }
}

/**
 * 600ms のデバウンス付き VocaDB 検索。
 * 新しい検索が呼ばれると、待機中の検索は中断される。
 */
export function searchVocaDbSongsDebounced(
  query: string,
  delay: number = VOCADB_DEBOUNCE_MS,
): Promise<VocaSong[]> {
  const trimmed = query.trim();

  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  rejectPending();
  activeController?.abort();
  activeController = null;

  if (!trimmed) return Promise.resolve([]);

  return new Promise<VocaSong[]>((resolve, reject) => {
    pendingReject = reject;
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      pendingReject = null;

      const controller = new AbortController();
      activeController = controller;

      searchVocaDbSongs(trimmed, controller.signal)
        .then((songs) => {
          if (activeController === controller) activeController = null;
          resolve(songs);
        })
        .catch((error: unknown) => {
          if (activeController === controller) activeController = null;
          reject(isAbortLike(error) ? new VocaDbAbortError() : error);
        });
    }, delay);
  });
}

/** 待機中・実行中の VocaDB 検索を中断する */
export function cancelVocaDbSearch(): void {
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
  rejectPending();
  activeController?.abort();
  activeController = null;
}
