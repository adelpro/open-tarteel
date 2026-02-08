'use client';

import { useAtom } from 'jotai';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { recitersSortAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import { fuzzySearch, generateFavId } from '@/utils';

// Define parsers for URL state management
// Using shorter keys (q, r) for cleaner URLs
// Define all possible Riwaya values plus 'all'
const riwayaValues = ['all', ...Object.values(Riwaya)] as const;

const filterSearchParsers = {
  searchQuery: parseAsString.withDefault(''),
  selectedRiwaya: parseAsStringLiteral(riwayaValues).withDefault(
    'all' as const
  ),
};

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
  // Use nuqs for URL state management with shorter keys
  const [{ searchQuery: searchTerm, selectedRiwaya }, setFilters] =
    useQueryStates(filterSearchParsers, {
      urlKeys: {
        searchQuery: 'q',
        selectedRiwaya: 'r',
      },
      history: 'replace', // Replace instead of push to avoid history spam
    });

  // Keep sortMode in Jotai for non-URL state
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
    // Apply favorite and riwaya filters first
    let filtered = reciters.filter((r) => {
      const id = generateFavId(r);
      if (showOnlyFavorites && !favoriteReciters.includes(id)) return false;
      if (selectedRiwaya !== 'all' && r.moshaf.riwaya !== selectedRiwaya)
        return false;
      return true;
    });

    // Apply fuzzy search if there's a search term
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = fuzzySearch(filtered, searchTerm);
    }

    // Sort the filtered results
    return filtered.sort((a, b) => {
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
    setSearchTerm: (value: string) => setFilters({ searchQuery: value }),
    selectedRiwaya,
    setSelectedRiwaya: (value: Riwaya | 'all') =>
      setFilters({ selectedRiwaya: value }),
    sortMode,
    setSortMode,
    filteredReciters,
    availableRiwiyat,
  };
}
