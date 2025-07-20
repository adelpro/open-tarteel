'use client';

import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import {
  TbSortDescending2Filled,
  TbSortDescendingLetters,
  TbSortDescendingNumbers,
} from 'react-icons/tb';
import { useIntl } from 'react-intl';

import ReciterCard from '@/components/reciter-card';
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

  const favoriteRecitersList = reciters.filter((r) =>
    favoriteReciters.includes(generateFavId(r))
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

  const handleSearchTerm = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(null);
  };

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
            className="transitiont w-full rounded-full border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="absolute inset-y-0 left-2 flex items-center gap-2 pr-2">
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
              className="rounded-full p-1.5 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
              tabIndex={0}
            >
              {sortMode === 'alphabetical' ? (
                <TbSortDescendingLetters className="size-5 text-blue-500" />
              ) : sortMode === 'views' ? (
                <TbSortDescendingNumbers className="size-5 text-purple-500" />
              ) : (
                <TbSortDescending2Filled className="size-5 text-yellow-500" />
              )}
            </button>
            {favoriteRecitersList.length > 0 && (
              <button
                aria-label={showOnlyFavorites ? showAll : showFavorite}
                title={showOnlyFavorites ? showFavorite : showAll}
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`rounded-full p-1.5 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:hover:bg-gray-700 ${showOnlyFavorites ? 'bg-yellow-500 text-white' : ''}`}
                tabIndex={0}
              >
                {showOnlyFavorites ? (
                  <BsStarFill
                    className="size-5"
                    aria-label="favorite star icon"
                  />
                ) : (
                  <BsStar
                    className="size-5 text-black"
                    aria-label="favorite star icon"
                  />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedRiwaya('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              selectedRiwaya === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
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
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
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
