import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import {
  fetchFavoriteCounts,
  subscribeToFavoriteCounts,
  syncFavorite,
} from '@/gun/favorite-rank';
import { favoriteRecitersAtom } from '@/jotai/atom';

export function useFavorites() {
  const [favoriteReciters, setFavoriteReciters] = useAtom(favoriteRecitersAtom);
  const [globalCounts, setGlobalCounts] = useState<Record<string, number>>({});
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    fetchFavoriteCounts().then(setGlobalCounts);
    const unsubscribe = subscribeToFavoriteCounts(setGlobalCounts);
    return () => unsubscribe();
  }, []);

  const toggleFavorite = useCallback(
    (favId: string) => {
      const isFav = favoriteReciters.includes(favId);
      setFavoriteReciters((previous) =>
        isFav ? previous.filter((id) => id !== favId) : [...previous, favId]
      );
      syncFavorite(favId, !isFav);
    },
    [favoriteReciters, setFavoriteReciters]
  );

  return {
    favoriteReciters,
    globalCounts,
    toggleFavorite,
    showOnlyFavorites,
    setShowOnlyFavorites,
  };
}
