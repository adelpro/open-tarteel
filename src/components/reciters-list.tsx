'use client';

import { useAtom, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';

import { favoriteRecitersAtom, selectedReciterAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import { normalizeArabicText } from '@/utils';
import { getAllReciters } from '@/utils/api';

import SimpleSkeleton from './simple-skeleton';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};

const generateFavoriteId = (reciter: Reciter): string =>
  `${reciter.id}-${reciter.moshaf.id}`;

const isReciterFavorited = (
  reciter: Reciter,
  favoriteReciters: string[]
): boolean => favoriteReciters.includes(generateFavoriteId(reciter));

export default function RecitersList({ setIsOpen }: Props) {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const [favoriteReciters, setFavoriteReciters] = useAtom(favoriteRecitersAtom);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const reciterReferences = useRef<(HTMLButtonElement | null)[]>([]);
  const isUsingKeyboardRef = useRef(false);

  const toggleFavorite = (reciter: Reciter) => {
    const favId = generateFavoriteId(reciter);
    setFavoriteReciters((previous) =>
      previous.includes(favId)
        ? previous.filter((id) => id !== favId)
        : [...previous, favId]
    );
  };

  const getFavoriteReciters = useCallback(
    () => reciters.filter((r) => isReciterFavorited(r, favoriteReciters)),
    [reciters, favoriteReciters]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllReciters();
        setReciters(data);
      } catch (error_) {
        setError('فشل في تحميل القراء. يرجى المحاولة مرة أخرى.');
        console.error('Error loading reciters:', error_);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
    const keyHandler = () => (isUsingKeyboardRef.current = true);
    const mouseHandler = () => (isUsingKeyboardRef.current = false);
    window.addEventListener('keydown', keyHandler);
    window.addEventListener('mousedown', mouseHandler);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('mousedown', mouseHandler);
    };
  }, []);

  useEffect(() => {
    if (focusedIndex !== null) {
      reciterReferences.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    }
  }, [focusedIndex]);

  const sortedRiwiyat = Object.values(Riwaya).sort((a, b) =>
    a.localeCompare(b, 'ar', { sensitivity: 'base' })
  );
  const availableRiwiyat = sortedRiwiyat.filter((riwaya) =>
    reciters.some((r) => r.moshaf.riwaya === riwaya)
  );

  const filteredReciters = reciters
    .filter((r) => {
      if (showOnlyFavorites && !isReciterFavorited(r, favoriteReciters))
        return false;
      if (selectedRiwaya !== 'all' && r.moshaf.riwaya !== selectedRiwaya)
        return false;
      return normalizeArabicText(r.name).includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aFav = isReciterFavorited(a, favoriteReciters);
      const bFav = isReciterFavorited(b, favoriteReciters);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
    });

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      setSelectedReciter(reciter);
      setIsOpen(false);
      router.push(`/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`);
    },
    [router, setIsOpen, setSelectedReciter]
  );

  const handleSearchTerm = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(normalizeArabicText(event.target.value));
    setFocusedIndex(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (filteredReciters.length === 0) return;
      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          setFocusedIndex((previous) =>
            previous === null || previous === filteredReciters.length - 1
              ? 0
              : previous + 1
          );
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          setFocusedIndex((previous) =>
            previous === null || previous === 0
              ? filteredReciters.length - 1
              : previous - 1
          );
          break;
        }
        case 'Enter': {
          if (focusedIndex !== null)
            handleSelectReciter(filteredReciters[focusedIndex]);
          break;
        }
        case 'Escape': {
          setIsOpen(false);
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [filteredReciters, focusedIndex, handleSelectReciter, setIsOpen]);

  const renderReciterCard = (
    reciter: Reciter,
    index: number,
    isFavoriteSection = false
  ) => {
    const isFavorited = isReciterFavorited(reciter, favoriteReciters);
    return (
      <button
        key={`${reciter.id}-${reciter.moshaf.id}${isFavoriteSection ? '-fav' : ''}`}
        ref={(element) => {
          if (!isFavoriteSection) {
            reciterReferences.current[index] = element;
          }
        }}
        onClick={() => handleSelectReciter(reciter)}
        className={`relative flex w-full flex-col items-start justify-between rounded-xl border border-gray-200 p-5 text-right shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${
          !isFavoriteSection && focusedIndex === index
            ? 'scale-[1.02] transform ring-2 ring-blue-500'
            : ''
        } ${isFavorited ? 'ring-1 ring-yellow-200 dark:ring-yellow-800' : ''}`}
      >
        <h2 className="mb-2 text-xl font-semibold">{reciter.name}</h2>
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            <span
              role="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedRiwaya(reciter.moshaf.riwaya || Riwaya.Warsh);
              }}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
            >
              {reciter.moshaf.riwaya}
            </span>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(reciter);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                toggleFavorite(reciter);
              }
            }}
            className={`absolute left-3 top-3 cursor-pointer rounded-full p-1 transition-colors ${
              isFavorited
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400'
            }`}
            aria-label={
              isFavorited ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            {isFavorited ? (
              <BsStarFill className="h-6 w-6" />
            ) : (
              <BsStar className="h-6 w-6" />
            )}
          </div>
        </div>
      </button>
    );
  };

  const favoriteRecitersList = getFavoriteReciters();

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

        {favoriteRecitersList.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
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
          </div>
        )}

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
          {filteredReciters.length > 0 ? (
            filteredReciters.map((reciter, index) =>
              renderReciterCard(reciter, index)
            )
          ) : error ? null : (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              لا يوجد قراء مطابقين للبحث.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
