'use client';

import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback } from 'react';

import { createStorage } from '@/utils/storage/create-storage';

const RECENTLY_PLAYED_KEY = 'recently-played-reciters';
const recentlyPlayedStorage = createStorage<string[]>();
const recentlyPlayedAtom = atomWithStorage<string[]>(
  RECENTLY_PLAYED_KEY,
  [],
  recentlyPlayedStorage
);

export function useRecentlyPlayed() {
  const [recentIds, setRecentIds] = useAtom(recentlyPlayedAtom);

  const addToRecent = useCallback(
    (id: string) => {
      setRecentIds((previous) => {
        const filtered = previous.filter((item) => item !== id);

        const updated = [id, ...filtered].slice(0, 10);

        return updated;
      });
    },
    [setRecentIds]
  );

  const clearRecent = useCallback(() => {
    setRecentIds([]);
  }, [setRecentIds]);

  return {
    recentIds,
    addToRecent,
    clearRecent,
  };
}
