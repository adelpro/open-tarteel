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
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>(
    {}
  );
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    fetchFavoriteCounts().then(setFavoriteCounts);
    const unsubscribe = subscribeToFavoriteCounts(setFavoriteCounts);
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
    favoriteCounts,
    toggleFavorite,
    showOnlyFavorites,
    setShowOnlyFavorites,
  };
}
