import { useCallback, useEffect, useState } from 'react';
import type { VocaSong } from '../types/song';

interface SongCatalogState {
  songs: VocaSong[];
  loading: boolean;
  error: string | null;
}

function isVocaSongArray(value: unknown): value is VocaSong[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === 'number' &&
        typeof (entry as { title?: unknown }).title === 'string',
    )
  );
}

/** public/data/songs.json を読み込むフック */
export function useSongCatalog() {
  const [state, setState] = useState<SongCatalogState>({
    songs: [],
    loading: true,
    error: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    fetch(`${import.meta.env.BASE_URL}data/songs.json`)
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload: unknown = await response.json();
        if (!isVocaSongArray(payload)) {
          throw new Error('songs.json の形式が不正です');
        }
        return payload;
      })
      .then((songs) => {
        if (cancelled) return;
        setState({ songs, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          songs: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : '楽曲データを読み込めませんでした',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, reload };
}
