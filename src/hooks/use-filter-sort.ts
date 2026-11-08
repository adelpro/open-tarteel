'use client';

import { useAtom } from 'jotai';
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { SOURCE_LABEL_IDS } from '@/constants';
import { recitersSortAtom } from '@/jotai/atom';
import { LinkSource, Reciter, Riwaya } from '@/types';
import { fuzzySearch, generateFavId } from '@/utils';

// Define parsers for URL state management
// Using descriptive keys (query, riwaya, source) for clarity
// Define all possible Riwaya values. Empty selection means "all".
const riwayaValues = Object.values(Riwaya) as readonly Riwaya[];
const sourceValues = [
  LinkSource.MP3QURAN,
  LinkSource.MP3QURAN_V4,
  LinkSource.ITQAN,
  LinkSource.QURANAI,
  LinkSource.QURAN_FOUNDATION,
] as const;

const filterSearchParsers = {
  searchQuery: parseAsString.withDefault(''),
  selectedRiwiyat: parseAsArrayOf(
    parseAsStringLiteral(riwayaValues)
  ).withDefault([]),
  selectedSources: parseAsArrayOf(
    parseAsStringLiteral(sourceValues)
  ).withDefault([]),
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
  // Use nuqs for URL state management with descriptive keys
  const [
    { searchQuery: searchTerm, selectedRiwiyat, selectedSources },
    setFilters,
  ] = useQueryStates(filterSearchParsers, {
    urlKeys: {
      searchQuery: 'query',
      selectedRiwiyat: 'riwaya',
      selectedSources: 'source',
    },
    history: 'push',
    shallow: false, // Allow server to track state changes
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

  const availableSources = useMemo(() => {
    const present = new Set(reciters.map((r) => r.source));
    return [...present]
      .map((value) => ({
        value,
        label: formatMessage({ id: SOURCE_LABEL_IDS[value] }),
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
      );
  }, [reciters, formatMessage, locale]);

  const filteredReciters = useMemo(() => {
    // Apply favorite, riwaya and source filters first
    let filtered = reciters.filter((r) => {
      const id = generateFavId(r);
      if (showOnlyFavorites && !favoriteReciters.includes(id)) return false;
      if (
        selectedRiwiyat.length > 0 &&
        !selectedRiwiyat.includes(r.moshaf.riwaya)
      )
        return false;
      if (selectedSources.length > 0 && !selectedSources.includes(r.source))
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
    selectedRiwiyat,
    selectedSources,
    searchTerm,
    sortMode,
    favoriteCounts,
    viewCounts,
  ]);

  return {
    searchTerm,
    setSearchTerm: (value: string) => setFilters({ searchQuery: value }),
    selectedRiwiyat,
    setSelectedRiwiyat: (value: Riwaya[]) =>
      setFilters({ selectedRiwiyat: value }),
    selectedSources,
    setSelectedSources: (value: LinkSource[]) =>
      setFilters({ selectedSources: value }),
    sortMode,
    setSortMode,
    filteredReciters,
    availableRiwiyat,
    availableSources,
  };
}
