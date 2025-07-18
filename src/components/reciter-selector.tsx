'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';

import { useFavorites } from '@/hooks/use-favorites';
import { selectedReciterAtom } from '@/jotai/atom';
import searchSVG from '@/svgs/search.svg';
import { generateFavId } from '@/utils';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // This state holds the text displayed in the button.
  // Initialize it with the default value that the server will render.
  const [displayedReciterName, setDisplayedReciterName] =
    useState<string>('اختر القارئ');

  // This atom value will correctly load the persisted state from localStorage on the client.
  const selectedReciterValue = useAtomValue(selectedReciterAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();

  // Use useEffect to update the displayed name once the component has mounted on the client,
  // where localStorage (and thus the Jotai atom's persisted value) is available.
  useEffect(() => {
    if (selectedReciterValue) {
      setDisplayedReciterName(selectedReciterValue.name);
    } else {
      // If no reciter is selected (e.g., cleared from storage, or first visit),
      // revert to the default placeholder.
      setDisplayedReciterName('اختر القارئ');
    }
  }, [selectedReciterValue]); // Depend on selectedReciterValue to re-run when it changes

  const handleSearch = () => {
    setIsOpen(true);
  };

  // The connectionIcon function seems to return an empty fragment based on your original code.
  // It's already fine for SSR as it doesn't render varying text content.
  const connectionIcon = (): React.ReactNode => {
    if (selectedReciterValue === undefined) {
      return <></>;
    }
    return <></>;
  };

  return (
    <div className="flex w-full flex-row items-center justify-center">
      <div className="flex w-full max-w-md flex-row items-center justify-center gap-3 rounded-md border border-slate-200 p-2 shadow-md transition-transform hover:scale-105">
        {connectionIcon()}
        <button className="flex w-full max-w-md flex-row items-center justify-between">
          {/* Use the displayedReciterName state here to avoid hydration mismatch */}
          <span onClick={handleSearch} className="w-full text-start">
            {displayedReciterName}
          </span>

          <div className="flex items-center justify-center gap-2">
            {/* The favorite stars depend on selectedReciterValue,
                which is fine because their presence/icon changes are
                managed client-side after hydration, not causing text content mismatches. */}
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
