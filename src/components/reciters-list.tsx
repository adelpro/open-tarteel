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
import { Reciter } from '@/types';
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

  return (
    <section className="mx-auto w-full px-1">
      <div className="flex flex-col gap-4">
        <div className="relative flex w-full">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="ابحث عن القارئ"
            value={searchTerm}
            onChange={handleSearchTerm}
            className="transitiont w-full rounded-full border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none"
          />
          <div className="absolute inset-y-0 left-2 flex items-center gap-2 pr-2">
            <button
              aria-label="تغيير الترتيب"
              title={
                sortMode === 'alphabetical'
                  ? 'ترتيب أبجدي'
                  : sortMode === 'views'
                    ? 'ترتيب حسب المشاهدات'
                    : 'ترتيب حسب الشعبية'
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
                aria-label={showOnlyFavorites ? 'عرض الكل' : 'المفضلة فقط'}
                title={showOnlyFavorites ? 'عرض المفضلة فقط' : 'عرض الكل'}
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
            جميع الروايات
          </button>
          {availableRiwiyat.map((riwaya) => (
            <button
              key={riwaya}
              onClick={() => setSelectedRiwaya(riwaya)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedRiwaya === riwaya
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {riwaya}
            </button>
          ))}
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
                  لا يوجد قراء مطابقين للبحث.
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
