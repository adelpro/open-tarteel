'use client';
import { useAtomValue } from 'jotai';
import React from 'react';
import { BsBook } from 'react-icons/bs';
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
    <main className="animate-fade-up p-2 sm:p-4">
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-3 text-2xl font-black text-gray-800 dark:text-gray-100">
          <div className="dark:bg-brand-CTA-blue-400/10 dark:text-brand-CTA-blue-400 flex size-10 items-center justify-center rounded-xl bg-brand-CTA-blue-500/10 text-brand-CTA-blue-500">
            <BsBook className="size-5" />
          </div>
          {isEnlgish ? 'List of Surahs' : 'قائمة السور'}
        </h2>
        <span className="bg-brand-CTA-blue-100 dark:bg-brand-CTA-blue-900/30 dark:text-brand-CTA-blue-400 flex items-center rounded-full px-3 py-1 text-sm font-bold text-brand-CTA-blue-600 shadow-sm">
          {selectedReciter.moshaf.playlist.length}{' '}
          <span className="mx-1 font-normal">
            {isEnlgish ? 'Surahs' : 'سورة'}
          </span>
        </span>
      </div>
      <ul className="flex w-full flex-col gap-3">
        {selectedReciter?.moshaf?.playlist.map(
          (item: PlaylistItem, index: number) => {
            // Convert surahId to number and subtract 1 to get the correct index (since array is 0-indexed but surah IDs start at 1)
            const surahIndex = Number.parseInt(item.surahId) - 1;
            const surah = SURAHS[surahIndex];

            return (
              <li
                key={index}
                className="hover:border-brand-CTA-blue-200 hover:from-brand-CTA-blue-50/50 dark:hover:border-brand-CTA-blue-800/50 dark:hover:from-brand-CTA-blue-900/20 group w-full cursor-pointer rounded-xl border border-gray-200/60 bg-white p-3 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-gradient-to-r hover:to-white hover:shadow-md dark:border-gray-700/60 dark:bg-gray-800/50 dark:hover:to-gray-800/80"
                onClick={() => handlePlylistItemClick(index)}
              >
                <div className="flex items-center gap-4">
                  <span className="group-hover:bg-brand-CTA-blue-100 dark:group-hover:bg-brand-CTA-blue-900/60 dark:group-hover:text-brand-CTA-blue-400 flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500 transition-colors group-hover:text-brand-CTA-blue-600 dark:bg-gray-800 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="group-hover:text-brand-CTA-blue-700 dark:group-hover:text-brand-CTA-blue-300 text-lg font-bold text-gray-700 transition-colors dark:text-gray-200">
                        {isEnlgish
                          ? surah.englishName
                          : removeTashkeel(surah.name)}
                      </span>
                      <span className="group-hover:bg-brand-CTA-blue-50 dark:group-hover:bg-brand-CTA-blue-900/30 dark:group-hover:text-brand-CTA-blue-300 inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-500/20 transition-colors group-hover:text-brand-CTA-blue-600 group-hover:ring-brand-CTA-blue-500/20 dark:bg-gray-800/80 dark:text-gray-400 dark:ring-gray-600/50">
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
