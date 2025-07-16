import { useMemo, useState } from 'react';

import { Reciter, Riwaya } from '@/types';
import { normalizeArabicText } from '@/utils';

type UseFilterSortParams = {
  reciters: Reciter[];
  favoriteReciters: string[];
  showOnlyFavorites: boolean;
  globalCounts?: Record<string, number>;
};

export function useFilterSort({
  reciters,
  favoriteReciters,
  showOnlyFavorites,
  globalCounts = {},
}: UseFilterSortParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | 'all'>('all');
  const [sortMode, setSortMode] = useState<'popular' | 'alphabetical'>(
    'popular'
  );

  const availableRiwiyat = useMemo(() => {
    const sortedRiwiyat = Object.values(Riwaya).sort((a, b) =>
      a.localeCompare(b, 'ar', { sensitivity: 'base' })
    );
    return sortedRiwiyat.filter((riwaya) =>
      reciters.some((r) => r.moshaf.riwaya === riwaya)
    );
  }, [reciters]);

  const filteredReciters = useMemo(() => {
    const generateFavoriteId = (reciter: Reciter) =>
      `${reciter.id}-${reciter.moshaf.id}`;

    return reciters
      .filter((r) => {
        // Filter by favorites if showOnlyFavorites is true
        if (
          showOnlyFavorites &&
          !favoriteReciters.includes(generateFavoriteId(r))
        ) {
          return false;
        }

        // Filter by riwaya
        if (selectedRiwaya !== 'all' && r.moshaf.riwaya !== selectedRiwaya) {
          return false;
        }

        // Filter by search term
        return normalizeArabicText(r.name).includes(
          normalizeArabicText(searchTerm)
        );
      })
      .sort((a, b) => {
        if (sortMode === 'alphabetical') {
          return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        }

        // Popular sort - by favorite count
        const aId = generateFavoriteId(a);
        const bId = generateFavoriteId(b);
        const aCount = globalCounts[aId] ?? 0;
        const bCount = globalCounts[bId] ?? 0;

        // If counts are equal, fall back to alphabetical
        if (aCount === bCount) {
          return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        }

        return bCount - aCount; // Descending order (most popular first)
      });
  }, [
    reciters,
    favoriteReciters,
    showOnlyFavorites,
    selectedRiwaya,
    searchTerm,
    sortMode,
    globalCounts,
  ]);

  return {
    searchTerm,
    setSearchTerm,
    selectedRiwaya,
    setSelectedRiwaya,
    sortMode,
    setSortMode,
    filteredReciters,
    availableRiwiyat,
  };
}
