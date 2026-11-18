import { useCallback, useEffect, useMemo, useState } from 'react';
import type { VocaSong } from '../types/song';

export const MY_LIST_STORAGE_KEY = 'vocadig-mylist';
const MAX_MY_LIST_SIZE = 300;

function isVocaSong(value: unknown): value is VocaSong {
  if (typeof value !== 'object' || value === null) return false;
  const song = value as Partial<VocaSong>;
  return (
    typeof song.id === 'number' &&
    typeof song.title === 'string' &&
    Array.isArray(song.tags) &&
    Array.isArray(song.voicebanks) &&
    Array.isArray(song.pvs)
  );
}

/** localStorage からマイリストを読み込む（不正なデータは無視する） */
export function readStoredMyList(): VocaSong[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MY_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Map<number, VocaSong>();
    for (const entry of parsed) {
      if (isVocaSong(entry)) unique.set(entry.id, entry);
    }
    return [...unique.values()].slice(0, MAX_MY_LIST_SIZE);
  } catch {
    return [];
  }
}

function songArtist(song: VocaSong): string {
  return (
    song.producers.slice(0, 2).join(' / ') ||
    song.artistString ||
    'アーティスト不明'
  );
}

/** 共有用のテキスト一覧（曲名 / アーティスト / URL）を生成する */
export function buildMyListText(songs: VocaSong[]): string {
  return songs
    .map(
      (song, index) =>
        `${index + 1}. ${song.title} / ${songArtist(song)} / ${song.vocadbUrl}`,
    )
    .join('\n');
}

/** マイリストを JSON ファイルとしてダウンロードする */
export function downloadMyListJson(songs: VocaSong[]): void {
  const payload = {
    app: 'VocaDig',
    exportedAt: new Date().toISOString(),
    count: songs.length,
    songs,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `vocadig-mylist-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** マイリスト（お気に入り）を localStorage と同期するフック */
export function useMyList() {
  const [myList, setMyList] = useState<VocaSong[]>(readStoredMyList);

  useEffect(() => {
    try {
      window.localStorage.setItem(MY_LIST_STORAGE_KEY, JSON.stringify(myList));
    } catch {
      // 保存できなくてもアプリの動作は継続する
    }
  }, [myList]);

  // 別タブでの変更を反映する
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== MY_LIST_STORAGE_KEY) return;
      setMyList(readStoredMyList());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const myListIds = useMemo(
    () => new Set(myList.map((song) => song.id)),
    [myList],
  );

  const isInMyList = useCallback(
    (songId: number) => myListIds.has(songId),
    [myListIds],
  );

  const addToMyList = useCallback((song: VocaSong) => {
    setMyList((current) => {
      if (current.some((entry) => entry.id === song.id)) return current;
      return [song, ...current].slice(0, MAX_MY_LIST_SIZE);
    });
  }, []);

  const addManyToMyList = useCallback((songs: VocaSong[]) => {
    if (songs.length === 0) return;
    setMyList((current) => {
      const merged = new Map<number, VocaSong>();
      for (const song of songs) merged.set(song.id, song);
      for (const song of current) {
        if (!merged.has(song.id)) merged.set(song.id, song);
      }
      return [...merged.values()].slice(0, MAX_MY_LIST_SIZE);
    });
  }, []);

  const removeFromMyList = useCallback((songId: number) => {
    setMyList((current) => current.filter((song) => song.id !== songId));
  }, []);

  const toggleMyList = useCallback((song: VocaSong) => {
    setMyList((current) => {
      if (current.some((entry) => entry.id === song.id)) {
        return current.filter((entry) => entry.id !== song.id);
      }
      return [song, ...current].slice(0, MAX_MY_LIST_SIZE);
    });
  }, []);

  const clearMyList = useCallback(() => {
    setMyList([]);
  }, []);

  return {
    myList,
    myListIds,
    isInMyList,
    addToMyList,
    addManyToMyList,
    removeFromMyList,
    toggleMyList,
    clearMyList,
  };
}
