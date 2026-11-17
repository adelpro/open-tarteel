import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';

import { user } from '@/gun';
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
      // The ring copy. `null` clears the key; Gun keeps no arrays, so the
      // account's favourites are a set of `id: true` fields.
      if (user?.is) {
        user
          .get('favorites')
          .get(favId)
          .put(isFav ? null : true);
      }
      // The public counter moves only here, on a tap. Favourites that arrive
      // from the ring are written to the atom by `useUserSync` and skip it.
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
