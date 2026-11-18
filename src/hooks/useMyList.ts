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

function readStoredMyList(): VocaSong[] {
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
    removeFromMyList,
    toggleMyList,
    clearMyList,
  };
}
