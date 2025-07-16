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
    favoriteReciters.includes(`${r.id}-${r.moshaf.id}`)
  );

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      syncView(`${reciter.id}-${reciter.moshaf.id}`);
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
    <section className="mx-auto w-full px-4">
      <div className="flex flex-col gap-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="ابحث عن القارئ"
          value={searchTerm}
          onChange={handleSearchTerm}
          className="w-full rounded-xl border border-gray-300 p-3 text-right shadow-sm transition focus:border-blue-500 focus:outline-none"
        />

        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() =>
              setSortMode((previous) =>
                previous === 'popular'
                  ? 'alphabetical'
                  : previous === 'alphabetical'
                    ? 'views'
                    : 'popular'
              )
            }
            className="flex items-center gap-1 rounded-full bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {sortMode === 'alphabetical' ? (
              <>
                <TbSortDescending2Filled className="h-4 w-4 text-yellow-500" />
                الأكثر تفضيلاً
              </>
            ) : sortMode === 'views' ? (
              <>
                <TbSortDescendingNumbers className="h-4 w-4 text-purple-500" />
                حسب المشاهدات
              </>
            ) : (
              <>
                <TbSortDescendingLetters className="h-4 w-4 text-blue-500" />
                الترتيب الأبجدي
              </>
            )}
          </button>

          {favoriteRecitersList.length > 0 && (
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                showOnlyFavorites
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {showOnlyFavorites ? (
                <>
                  <BsStarFill className="h-4 w-4" /> عرض الكل
                </>
              ) : (
                <>
                  <BsStar className="h-4 w-4" /> المفضلة فقط (
                  {favoriteRecitersList.length})
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
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
                const favId = `${reciter.id}-${reciter.moshaf.id}`;
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
