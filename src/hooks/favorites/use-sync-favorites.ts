import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import {
  fetchFavoriteCounts,
  subscribeToFavoriteCounts,
} from '@/gun/favorite-rank';
import { favoriteCountsAtom } from '@/jotai/atoms';

export function useSyncFavorites() {
  const setFavoriteCounts = useSetAtom(favoriteCountsAtom);

  useEffect(() => {
    fetchFavoriteCounts().then(setFavoriteCounts);
    const unsubscribe = subscribeToFavoriteCounts(setFavoriteCounts);
    return () => unsubscribe();
  }, [setFavoriteCounts]);
}
