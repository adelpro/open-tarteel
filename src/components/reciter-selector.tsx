'use client';

import { useAtomValue } from 'jotai';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { useIntl } from 'react-intl';

import { useFavorites } from '@/hooks/use-favorites';
import { selectedReciterAtom } from '@/jotai/atom';
import searchSVG from '@/svgs/search.svg';
import { generateFavId } from '@/utils';
import { useShareReciter } from '@/utils/share';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const selectedReciter = useAtomValue(selectedReciterAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();
  const { formatMessage } = useIntl();
  const { shareReciter } = useShareReciter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR and first client render will match here
    return (
      <div className="flex w-full justify-center">
        <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white to-gray-100 p-3 shadow-md shadow-gray-300/20 dark:from-gray-700 dark:to-gray-600">
          <span className="h-4 w-40 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
      </div>
    );
  }

  const handleSearch = () => setIsOpen(true);

  const displayedReciterName =
    selectedReciter?.name ??
    formatMessage({
      id: 'reciter.select',
      defaultMessage: 'Select A Reciter',
    });

  const favId = selectedReciter ? generateFavId(selectedReciter) : null;
  const isFavorite = favId ? favoriteReciters.includes(favId) : false;

  const handleShare = async (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    if (selectedReciter) shareReciter(selectedReciter);
  };

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white to-gray-100 p-3 shadow-md shadow-gray-300/20 transition-all duration-200 hover:from-gray-50 hover:to-gray-200 hover:shadow-lg hover:shadow-gray-300/25 focus:outline-none focus:ring-4 focus:ring-gray-400/50 active:scale-95 dark:from-gray-700 dark:to-gray-600 dark:shadow-gray-700/15 dark:hover:from-gray-600 dark:hover:to-gray-500 dark:hover:shadow-gray-600/20">
        <button
          type="button"
          onClick={handleSearch}
          className="flex w-full items-center justify-between text-start"
          aria-label="Open reciter selector"
        >
          <span className="max-w-[200px] truncate font-semibold text-gray-900 dark:text-gray-100">
            {displayedReciterName}
          </span>

          <div className="flex items-center gap-2">
            {/* Share */}
            {selectedReciter && (
              <FaRegShareFromSquare
                size={22}
                className="cursor-pointer text-gray-600/80 transition-colors hover:text-white"
                onClick={handleShare}
                tabIndex={0}
                role="button"
                aria-label="Share reciter"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    handleShare(event);
                  }
                }}
              />
            )}

            {/* Favorite */}
            {selectedReciter &&
              favId &&
              (isFavorite ? (
                <BsStarFill
                  size={25}
                  className="cursor-pointer text-yellow-300 transition-colors hover:text-yellow-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(favId);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed="true"
                  aria-label="Remove from favorites"
                />
              ) : (
                <BsStar
                  size={25}
                  className="cursor-pointer text-gray-600/80 transition-colors hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(favId);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed="false"
                  aria-label="Add to favorites"
                />
              ))}

            {/* Search icon */}
            <Image
              src={searchSVG}
              alt="Search reciters"
              width={30}
              height={30}
              className="cursor-pointer text-gray-600/80 transition-colors hover:text-gray-900 dark:text-gray-400/80 dark:hover:text-gray-100"
              onClick={handleSearch}
            />
          </div>
        </button>
      </div>

      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
