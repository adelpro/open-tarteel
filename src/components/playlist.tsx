'use client';
import { useAtomValue } from 'jotai';
import React from 'react';
import { useIntl } from 'react-intl';

import { SURAHS } from '@/constants';
import { selectedReciterAtom } from '@/jotai/atom';
import { PlaylistItem } from '@/types';
import { removeTashkeel } from '@/utils';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function Playlist({ setIsOpen, setCurrentTrack }: Props) {
  const language = useIntl().locale;
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const handlePlylistItemClick = (index: number) => {
    setIsOpen(false);
    setCurrentTrack(index);
  };

  const isEnlgish = language === 'en';

  if (!selectedReciter?.moshaf?.playlist) {
    return <></>;
  }

  return (
    <main>
      <ul className="my-2 w-full pl-3">
        {selectedReciter?.moshaf?.playlist.map(
          (item: PlaylistItem, index: number) => {
            // Convert surahId to number and subtract 1 to get the correct index (since array is 0-indexed but surah IDs start at 1)
            const surahIndex = Number.parseInt(item.surahId) - 1;
            const surah = SURAHS[surahIndex];

            return (
              <li
                key={index}
                className="mx-2 my-3 w-full cursor-pointer rounded border-b border-gray-100 p-3 text-slate-500 transition-colors duration-300 hover:bg-gray-50 hover:text-slate-800"
                onClick={() => handlePlylistItemClick(index)}
              >
                <div className="flex items-center">
                  <span className="m-2 flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-medium">
                        {isEnlgish
                          ? surah.englishName
                          : removeTashkeel(surah.name)}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                        {surah.ayahCount}{' '}
                        {isEnlgish
                          ? surah.ayahCount === 1
                            ? 'Aya'
                            : 'Ayas'
                          : surah.ayahCount === 1
                            ? 'آية'
                            : 'آيات'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          }
        )}
      </ul>
    </main>
  );
}
