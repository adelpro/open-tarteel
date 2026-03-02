'use client';

import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';

import SimpleSkeleton from '@/components/simple-skeleton';
import { syncView } from '@/gun/view-rank';
import { getMessageConfig as t } from '@/helpers';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useSyncFavorites } from '@/hooks/favorites/use-sync-favorites';
import {
  useRecentReciters,
  useRecentRecitersData,
} from '@/hooks/recent-reciters';
import {
  useReciters,
  useRecitersData,
  useRecitersFilter,
  useSyncReciters,
} from '@/hooks/reciters';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useSyncViewCounts, useViewCounts } from '@/hooks/views-count';
import { selectedReciterAtom } from '@/jotai/atoms';
import { Reciter, SORT_TYPE } from '@/types';
import { fuzzySearch, generateFavId } from '@/utils';

import { isRecitersListOpenAtom } from '.';
import ReciterCard from './reciter-card';

export default function RecitersList() {
  const {
    loading, //
    error,
  } = useReciters();
  useSyncReciters();

  const { recentIds } = useRecentRecitersData();

  const {
    searchTerm, //
    selectedRiwaya,
    sortMode,
    showRecentOnly,
  } = useRecitersFilter();

  const { reciters } = useRecitersData();

  const {
    focusedIndex, //
    reciterRefs,
    resetFocusedIndex,
    setRecitersCount,
  } = useKeyboardNavigation();

  const {
    favoriteReciters, //
    favoriteCounts,
    showOnlyFavorites,
  } = useFavorites();
  useSyncFavorites();

  const viewCounts = useViewCounts();
  useSyncViewCounts();

  const { add } = useRecentReciters();

  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const setIsRecitersListOpen = useSetAtom(isRecitersListOpenAtom);

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      const favId = generateFavId(reciter);
      add(reciter);
      syncView(favId);
      setSelectedReciter(reciter);
      setIsRecitersListOpen(false);
    },
    [add, setSelectedReciter, setIsRecitersListOpen]
  );

  const baseReciters = useMemo(() => {
    const recentIndexMap = new Map(recentIds.map((id, index) => [id, index]));

    const filtered = reciters
      .map((r) => ({
        reciter: r,
        id: generateFavId(r),
      }))
      .filter(({ reciter, id }) => {
        if (showOnlyFavorites && !favoriteReciters.includes(id)) return false;
        if (selectedRiwaya !== null && reciter.moshaf.riwaya !== selectedRiwaya)
          return false;
        return true;
      });

    let processed = filtered;

    if (searchTerm?.trim()) {
      processed = fuzzySearch(
        filtered.map((f) => f.reciter),
        searchTerm
      ).map((r) => ({
        reciter: r,
        id: generateFavId(r),
      }));
    }

    const collator = new Intl.Collator('ar', { sensitivity: 'base' });

    const comparator = (
      a: (typeof processed)[number],
      b: (typeof processed)[number]
    ) => {
      if (sortMode === SORT_TYPE.ALPHABETICAL) {
        return collator.compare(a.reciter.name, b.reciter.name);
      }

      if (sortMode === SORT_TYPE.VIEWS) {
        const diff = (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0);
        return diff === 0
          ? collator.compare(a.reciter.name, b.reciter.name)
          : diff;
      }

      // popular
      const diff = (favoriteCounts[b.id] ?? 0) - (favoriteCounts[a.id] ?? 0);

      return diff === 0
        ? collator.compare(a.reciter.name, b.reciter.name)
        : diff;
    };

    const sorted = processed.toSorted(comparator);

    if (!showRecentOnly) return sorted;

    return sorted
      .filter((s) => recentIndexMap.has(s.id))
      .sort((a, b) => {
        const aIndex = recentIndexMap.get(a.id) ?? 0;
        const bIndex = recentIndexMap.get(b.id) ?? 0;
        return aIndex - bIndex;
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
    showRecentOnly,
    recentIds,
  ]);

  useEffect(() => {
    resetFocusedIndex();
  }, [
    searchTerm,
    selectedRiwaya,
    sortMode,
    showOnlyFavorites,
    showRecentOnly,
    resetFocusedIndex,
  ]);

  useEffect(() => {
    setRecitersCount(baseReciters.length);
  }, [baseReciters.length, setRecitersCount]);

  if (loading) return <SimpleSkeleton />;

  if (error) return <ErrorState massage={error} />;

  if (baseReciters?.length === 0) return <RecitersEmptyState />;

  return baseReciters.map(({ reciter, id }, index) => (
    <ReciterCard
      key={id}
      reciter={reciter}
      isFocused={focusedIndex === index}
      onSelect={handleSelectReciter}
      refCallback={(element) => (reciterRefs.current[index] = element)}
    />
  ));
}

function RecitersEmptyState() {
  const { formatMessage } = useIntl();
  const noRecitersFound = formatMessage(t('noRecitersFound'));
  return (
    <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
      {noRecitersFound}
    </p>
  );
}
function ErrorState({ massage }: { readonly massage: string }) {
  return <p className="col-span-full text-center text-red-500">{massage}</p>;
}
