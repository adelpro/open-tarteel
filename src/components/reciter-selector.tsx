'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { useState } from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import searchSVG from '@/svgs/search.svg';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedReciterValue = useAtomValue(selectedReciterAtom);
  const onButtonClick = () => {
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
        <button
          className="flex w-full max-w-md flex-row items-center justify-between"
          onClick={onButtonClick}
        >
          <span>
            {selectedReciterValue ? selectedReciterValue.name : 'اختر القارئ'}
          </span>

          <Image src={searchSVG} alt="search" width={30} height={30} />
        </button>
      </div>
      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
