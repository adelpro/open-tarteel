'use client';

import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';
import { normalizeArabicText } from '@/utils';
import { getAllReciters } from '@/utils/api';

import SimpleSkeleton from './simple-skeleton';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};

export default function RecitersList({ setIsOpen }: Props) {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const reciterReferences = useRef<(HTMLButtonElement | null)[]>([]);
  const isUsingKeyboardRef = useRef(false);

  // Fetch reciters
  useEffect(() => {
    const loadReciters = async () => {
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
    loadReciters();
  }, []);

  // Auto-focus search input after mount (safe for mobile)
  // Keyboard navigation
  // BUG auto focus no working
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 300);

    // Detect keyboard use
    const handleKeyDown = () => {
      isUsingKeyboardRef.current = true;
    };

    const handleMouseDown = () => {
      isUsingKeyboardRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex !== null && reciterReferences.current[focusedIndex]) {
      reciterReferences.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        inline: 'start',
        behavior: 'smooth',
      });
    }
  }, [focusedIndex]);

  // Sort Riwaya options alphabetically
  const sortedRiwiyat = Object.values(Riwaya).sort((a, b) =>
    a.localeCompare(b, 'ar', { sensitivity: 'base' })
  );

  // Filtered Riwayas that actually have reciters
  const availableRiwiyat = sortedRiwiyat.filter((riwaya) =>
    reciters.some((r) => r.moshaf.riwaya === riwaya)
  );

  // Filter and sort reciters
  const filteredReciters = reciters
    .filter(
      (r) => selectedRiwaya === 'all' || r.moshaf.riwaya === selectedRiwaya
    )
    .filter((r) =>
      normalizeArabicText(r.name).includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' })
    );

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      setSelectedReciter(reciter);
      setIsOpen(false);
      router.push(`/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`);
    },
    [router, setIsOpen, setSelectedReciter]
  );

  const handleRiwayaClick = (riwaya: Riwaya) => {
    setSelectedRiwaya(riwaya);
  };

  const handleSearchTerm = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    const normalizedTerm = normalizeArabicText(term);
    setSearchTerm(normalizedTerm);
    setFocusedIndex(null); // Reset focused index on new search
  };

  // Handle keyboard navigation
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
          if (focusedIndex !== null) {
            handleSelectReciter(filteredReciters[focusedIndex]);
          }
          break;
        }

        case 'Escape': {
          setIsOpen(false);
          break;
        }

        default: {
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown as any);
    return () => {
      window.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [filteredReciters, focusedIndex, handleSelectReciter, setIsOpen]);

  return (
    <section className="mx-auto w-full px-4">
      <div className="flex flex-col gap-4">
        {/* Search Input */}
        <input
          ref={searchInputRef}
          type="text"
          placeholder="ابحث عن القارئ"
          value={searchTerm}
          onChange={handleSearchTerm}
          className="w-full rounded-xl border border-gray-300 bg-white p-3 text-right shadow-sm transition focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800"
        />

        {/* Riwaya Filters */}
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

        {/* Loader or Error State */}
        {loading && (
          <div className="text-center">
            <SimpleSkeleton />
          </div>
        )}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Reciters List */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReciters.length > 0 ? (
            filteredReciters.map((reciter, index) => (
              <button
                key={`${reciter.id} - ${reciter.moshaf.id}`}
                ref={(element: HTMLButtonElement | null) => {
                  reciterReferences.current[index] = element;
                }}
                onClick={() => handleSelectReciter(reciter)}
                className={`flex w-full flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-5 text-right shadow-md transition-all hover:scale-[1.02] hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${
                  focusedIndex === index
                    ? 'scale-[1.02] transform ring-2 ring-blue-500'
                    : ''
                }`}
              >
                <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {reciter.name}
                </h2>
                <span
                  role="button"
                  onClick={(event) => {
                    event.stopPropagation(); // Prevent triggering parent click
                    // TODO update this logic
                    handleRiwayaClick(reciter.moshaf.riwaya || Riwaya.Warsh);
                  }}
                  className="self-end rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                >
                  {reciter.moshaf.riwaya}
                </span>
              </button>
            ))
          ) : error ? (
            <></>
          ) : (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              لا يوجد قراء مطابقين للبحث.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
