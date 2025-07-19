'use client';

import { useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { useIntl } from 'react-intl';

import { useFavorites } from '@/hooks/use-favorites';
import { selectedReciterAtom } from '@/jotai/atom';
import searchSVG from '@/svgs/search.svg';
import { generateFavId } from '@/utils';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedReciterValue = useAtomValue(selectedReciterAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();

  const handleSearch = () => setIsOpen(true);
  const { formatMessage } = useIntl();

  const displayedReciterName =
    selectedReciterValue?.name ??
    formatMessage({ id: 'reciter.select', defaultMessage: 'Select A Reciter' });

  const favId = selectedReciterValue
    ? generateFavId(selectedReciterValue)
    : null;
  const isFavorite = favId ? favoriteReciters.includes(favId) : false;

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-md border border-slate-200 p-2 shadow-md transition-transform hover:scale-105">
        <button
          type="button"
          onClick={handleSearch}
          className="flex w-full items-center justify-between text-start"
          aria-label="Open reciter selector"
        >
          <span>{displayedReciterName}</span>
          <div className="flex items-center gap-2">
            {selectedReciterValue &&
              favId &&
              (isFavorite ? (
                <BsStarFill
                  size={25}
                  className="cursor-pointer text-yellow-500"
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
                  className="cursor-pointer"
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
            <Image
              src={searchSVG}
              alt="Search reciters"
              width={30}
              height={30}
              className="cursor-pointer"
              onClick={handleSearch}
            />
          </div>
        </button>
      </div>

      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
