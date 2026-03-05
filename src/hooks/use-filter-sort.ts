'use client';

import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

import { recitersSortAtom, selectedRiwayaAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import {
  FUZZY_SEARCH_THRESHOLD,
  fuzzyScoreReciter,
  generateFavId,
} from '@/utils';

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
  const [selectedRiwaya, setSelectedRiwaya] = useAtom(selectedRiwayaAtom);
  const [sortMode, setSortMode] = useAtom(recitersSortAtom);
  const { formatMessage, locale } = useIntl();
  const availableRiwiyat = useMemo(() => {
    return Object.entries(Riwaya)
      .filter(([_, value]) => reciters.some((r) => r.moshaf.riwaya === value))
      .map(([key, value]) => ({
        value,
        label: formatMessage({ id: `riwaya.${key}` }),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
      );
  }, [reciters, formatMessage, locale]);

  const filteredReciters = useMemo(() => {
    return reciters
      .filter((r) => {
        const id = generateFavId(r);
        if (showOnlyFavorites && !favoriteReciters.includes(id)) return false;
        if (selectedRiwaya !== 'all' && r.moshaf.riwaya !== selectedRiwaya)
          return false;
        const searchScore = fuzzyScoreReciter(r.name, searchTerm);
        return searchScore > FUZZY_SEARCH_THRESHOLD;
      })
      .sort((a, b) => {
        if (searchTerm.trim()) {
          const aScore = fuzzyScoreReciter(a.name, searchTerm);
          const bScore = fuzzyScoreReciter(b.name, searchTerm);
          if (Math.abs(aScore - bScore) > 0.01) {
            return bScore - aScore; // Higher score first
          }
        }
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
