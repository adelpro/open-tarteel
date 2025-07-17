'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';

import { useFavorites } from '@/hooks/use-favorites';
import { selectedReciterAtom } from '@/jotai/atom';
import searchSVG from '@/svgs/search.svg';
import { generateFavId } from '@/utils';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedReciterValue = useAtomValue(selectedReciterAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();
  const handleSearch = () => {
    setIsOpen(true);
  };
  const connectionIcon = (): React.ReactNode => {
    if (selectedReciterValue === undefined) {
      return <></>;
    }
  };

  return (
    <div className="flex w-full flex-row items-center justify-center">
      <div className="flex w-full max-w-md flex-row items-center justify-center gap-3 rounded-md border border-slate-200 p-2 shadow-md transition-transform hover:scale-105">
        {connectionIcon()}
        <button className="flex w-full max-w-md flex-row items-center justify-between">
          <span onClick={handleSearch} className="w-full">
            {selectedReciterValue ? selectedReciterValue.name : 'اختر القارئ'}
          </span>

          <div className="flex items-center justify-center gap-2">
            {selectedReciterValue ? (
              favoriteReciters.includes(generateFavId(selectedReciterValue)) ? (
                <BsStar
                  size={25}
                  onClick={() =>
                    toggleFavorite(generateFavId(selectedReciterValue))
                  }
                />
              ) : (
                <BsStarFill
                  size={25}
                  className="text-yellow-500"
                  onClick={() =>
                    toggleFavorite(generateFavId(selectedReciterValue))
                  }
                />
              )
            ) : (
              <></>
            )}
            <Image
              src={searchSVG}
              alt="search"
              width={30}
              height={30}
              onClick={handleSearch}
            />
          </div>
        </button>
      </div>
      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
