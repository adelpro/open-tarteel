import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';

import { selectedRiwayaAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import { generateFavId, normalizeArabicText } from '@/utils';

type UseFilterSortParams = {
  reciters: Reciter[];
  favoriteReciters: string[];
  showOnlyFavorites: boolean;
  favoriteCounts?: Record<string, number>;
  viewCounts?: Record<string, number>;
};

export function useFilterSort({
  reciters,
  favoriteReciters,
  showOnlyFavorites,
  favoriteCounts = {},
  viewCounts = {},
}: UseFilterSortParams) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiwaya, setSelectedRiwaya] = useAtom<Riwaya | 'all'>(
    selectedRiwayaAtom
  );
  const [sortMode, setSortMode] = useState<
    'popular' | 'alphabetical' | 'views'
  >('popular');

  const availableRiwiyat = useMemo(() => {
    const sortedRiwiyat = Object.values(Riwaya).sort((a, b) =>
      a.localeCompare(b, 'ar', { sensitivity: 'base' })
    );
    return sortedRiwiyat.filter((riwaya) =>
      reciters.some((r) => r.moshaf.riwaya === riwaya)
    );
  }, [reciters]);

  const filteredReciters = useMemo(() => {
    return reciters
      .filter((r) => {
        const id = generateFavId(r);
        if (showOnlyFavorites && !favoriteReciters.includes(id)) return false;
        if (selectedRiwaya !== 'all' && r.moshaf.riwaya !== selectedRiwaya)
          return false;
        return normalizeArabicText(r.name).includes(
          normalizeArabicText(searchTerm)
        );
      })
      .sort((a, b) => {
        const aId = generateFavId(a);
        const bId = generateFavId(b);

        if (sortMode === 'alphabetical') {
          return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        }

        if (sortMode === 'views') {
          const aViews = viewCounts[aId] ?? 0;
          const bViews = viewCounts[bId] ?? 0;
          if (aViews === bViews) {
            return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
          }
          return bViews - aViews;
        }

        // Default to 'popular'
        const aCount = favoriteCounts[aId] ?? 0;
        const bCount = favoriteCounts[bId] ?? 0;
        if (aCount === bCount) {
          return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        }
        return bCount - aCount;
      });
  }, [
    reciters,
    favoriteReciters,
    showOnlyFavorites,
    selectedRiwaya,
    searchTerm,
    sortMode,
    favoriteCounts,
    viewCounts,
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
