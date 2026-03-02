import { useAtom } from 'jotai';
import { useCallback } from 'react';

import { syncFavorite } from '@/gun/favorite-rank';
import {
  favoriteCountsAtom,
  favoriteRecitersAtom,
  showFavoriteRecitersOnlyAtom,
} from '@/jotai/atoms';

export function useFavorites() {
  const [favoriteReciters, setFavoriteReciters] = useAtom(favoriteRecitersAtom);
  const [showOnlyFavorites, setShowOnlyFavorites] = useAtom(
    showFavoriteRecitersOnlyAtom
  );
  const [favoriteCounts, setFavoriteCounts] = useAtom(favoriteCountsAtom);

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

    setFavoriteReciters,
    setShowOnlyFavorites,
    setFavoriteCounts,
  };
}
