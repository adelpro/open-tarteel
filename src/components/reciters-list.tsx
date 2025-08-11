'use client';

import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { ImSortAmountDesc } from 'react-icons/im';
import {
  TbSortAscendingLetters,
  TbSortDescendingNumbers,
} from 'react-icons/tb';
import { useIntl } from 'react-intl';

import {
  fetchViewCounts,
  subscribeToViewCounts,
  syncView,
} from '@/gun/view-rank';
import { useFavorites } from '@/hooks/use-favorites';
import { useFilterSort } from '@/hooks/use-filter-sort';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useReciters } from '@/hooks/use-reciters';
import { selectedReciterAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import { generateFavId } from '@/utils';

import ReciterCard from './reciter-card';
import SimpleSkeleton from './simple-skeleton';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};

export default function RecitersList({ setIsOpen }: Props) {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);

  const { reciters, loading, error } = useReciters();

  const {
    favoriteReciters,
    favoriteCounts,
    toggleFavorite,
    showOnlyFavorites,
    setShowOnlyFavorites,
  } = useFavorites();

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchViewCounts().then(setViewCounts);
    const unsubscribe = subscribeToViewCounts(setViewCounts);
    return () => unsubscribe();
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    selectedRiwaya,
    setSelectedRiwaya,
    sortMode,
    setSortMode,
    filteredReciters,
    availableRiwiyat,
  } = useFilterSort({
    reciters,
    favoriteCounts,
    viewCounts,
    favoriteReciters,
    showOnlyFavorites,
  });

  const { formatMessage } = useIntl();

  const searchPlaceHolder = formatMessage({
    id: 'searchPlaceHolder',
    defaultMessage: 'Search A Reciter',
  });

  const sort = formatMessage({
    id: 'sort',
    defaultMessage: 'Sort',
  });

  const sortByAlphabet = formatMessage({
    id: 'sort.byAlphabet',
    defaultMessage: 'Sort by Alphabet',
  });

  const sortByFavorite = formatMessage({
    id: 'sort.byFavorite',
    defaultMessage: 'Sort by Favorite',
  });

  const sortByViews = formatMessage({
    id: 'sort.byViews',
    defaultMessage: 'Sort by Views',
  });

  const showAll = formatMessage({
    id: 'showAll',
    defaultMessage: 'Show All',
  });

  const showFavorite = formatMessage({
    id: 'showFavorite',
    defaultMessage: 'Show Favorite',
  });

  const noRecitersFound = formatMessage({
    id: 'noRecitersFound',
    defaultMessage: 'No reciters found.',
  });

  const allReciters = formatMessage({
    id: 'allReciters',
    defaultMessage: 'All Reciters',
  });

  const { focusedIndex, setFocusedIndex, reciterRefs, searchInputRef } =
    useKeyboardNavigation(filteredReciters.length);

  const favoriteRecitersList = useMemo(
    () => reciters.filter((r) => favoriteReciters.includes(generateFavId(r))),
    [reciters, favoriteReciters]
  );

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      syncView(generateFavId(reciter));
      setSelectedReciter(reciter);
      setIsOpen(false);
      router.push(`/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`);
    },
    [router, setIsOpen, setSelectedReciter]
  );

  const handleSearchTerm = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setFocusedIndex(null);
    },
    [setSearchTerm, setFocusedIndex]
  );

  useEffect(() => {
    if (favoriteRecitersList.length === 0) {
      setShowOnlyFavorites(false);
    }
  }, [favoriteRecitersList.length, setShowOnlyFavorites]);

  return (
    <section className="mx-auto w-full px-1">
      <div className="flex flex-col gap-4">
        <div className="relative flex w-full">
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceHolder}
            value={searchTerm}
            onChange={handleSearchTerm}
            className="w-full rounded-full border border-gray-300 p-3 shadow-sm focus:border-brand-CTA-blue-500 focus:outline-none"
          />
          <div className="absolute inset-y-0 end-2 flex items-center gap-2 pr-2">
            <button
              aria-label={sort}
              title={
                sortMode === 'alphabetical'
                  ? sortByAlphabet
                  : sortMode === 'views'
                    ? sortByViews
                    : sortByFavorite
              }
              onClick={() =>
                setSortMode((previous) =>
                  previous === 'popular'
                    ? 'alphabetical'
                    : previous === 'alphabetical'
                      ? 'views'
                      : 'popular'
                )
              }
              className="hover:bg-brand-CTA-blue-50 dark:hover:bg-brand-CTA-blue-900/30 dark:hover:text-brand-CTA-blue-400 rounded-full p-2.5 text-gray-500 transition-all duration-200 hover:text-brand-CTA-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/50"
              tabIndex={0}
            >
              {sortMode === 'alphabetical' ? (
                <TbSortAscendingLetters className="size-5" />
              ) : sortMode === 'views' ? (
                <TbSortDescendingNumbers className="size-5" />
              ) : (
                <ImSortAmountDesc className="size-5" />
              )}
            </button>
            {favoriteRecitersList.length > 0 && (
              <button
                aria-label={showOnlyFavorites ? showAll : showFavorite}
                title={showOnlyFavorites ? showAll : showFavorite}
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className="rounded-lg p-2.5 transition-all duration-200 hover:bg-yellow-50 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400"
                tabIndex={0}
              >
                {showOnlyFavorites ? (
                  <BsStarFill className="size-5 text-yellow-500" />
                ) : (
                  <BsStar className="size-5 text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedRiwaya('all')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              selectedRiwaya === 'all'
                ? 'bg-gradient-to-r from-brand-CTA-blue-600 to-brand-CTA-blue-500 text-white shadow-lg shadow-brand-CTA-blue-500/25'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {allReciters}
          </button>
          {availableRiwiyat.map(({ value, label }) => {
            const isSelected = selectedRiwaya === value;
            return (
              <button
                key={value}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedRiwaya(value as Riwaya | 'all');
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-brand-CTA-blue-600 to-brand-CTA-blue-500 text-white shadow-lg shadow-brand-CTA-blue-500/25'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {showOnlyFavorites && favoriteRecitersList.length > 0 && (
          <section className="mt-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white">
              <BsStarFill className="h-6 w-6 text-yellow-500" /> المفضلة (
              {favoriteRecitersList.length})
            </h2>
          </section>
        )}

        {loading && (
          <div className="text-center">
            <SimpleSkeleton />
          </div>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReciters.length > 0
            ? filteredReciters.map((reciter, index) => {
                const favId = generateFavId(reciter);
                const isFavorited = favoriteReciters.includes(favId);

                return (
                  <ReciterCard
                    key={favId}
                    reciter={reciter}
                    favoriteCount={favoriteCounts[favId] ?? 0}
                    viewCount={viewCounts[favId] ?? 0}
                    index={index}
                    isFavorite={isFavorited}
                    isFocused={focusedIndex === index}
                    refCallback={(element) =>
                      (reciterRefs.current[index] = element)
                    }
                    onSelect={handleSelectReciter}
                    onFavoriteToggle={() => toggleFavorite(favId)}
                    onSelectRiwaya={(riwaya) => setSelectedRiwaya(riwaya)}
                  />
                );
              })
            : !error && (
                <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
                  {noRecitersFound}
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
