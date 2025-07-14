'use client';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React from 'react';

import { RECITERS } from '@/constants';
import { selectedReciterAtom } from '@/jotai/atom';
import { Reciter, Riwaya } from '@/types';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
};
export default function RecitersList({ setIsOpen }: Props) {
  const navigate = useRouter();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [selectedRiwaya, setSelectedRiwaya] = React.useState<Riwaya | 'all'>(
    'all'
  );

  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const selectedReciterClickHandler = (reciter: Reciter) => {
    setSelectedReciter(reciter);
    setIsOpen(false);
    setSearchTerm('');
    navigate.push(`/reciter/${reciter.id}`);
  };

  const filteredReciters = RECITERS.filter(
    (reciter) =>
      reciter.name.includes(searchTerm) &&
      (selectedRiwaya === 'all' || reciter.riwaya === selectedRiwaya)
  );
  return (
    <section className="w-full">
      <div className="mx-auto flex flex-col gap-1 p-2">
        <input
          type="search"
          placeholder="ابحث عن القارئ"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-200 bg-background p-2 text-right shadow-md dark:border-gray-400"
        />
        <div className="mb-4 flex flex-row-reverse flex-wrap items-center justify-center gap-2">
          <label className="inline-flex flex-row-reverse items-center">
            <input
              type="radio"
              className="h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 transition-colors checked:border-brand-CTA-blue-500 checked:bg-brand-CTA-blue-500"
              name="riwaya"
              value="all"
              checked={selectedRiwaya === 'all'}
              onChange={() => setSelectedRiwaya('all')}
            />
            <span
              className="mx-1 cursor-pointer"
              onClick={() => setSelectedRiwaya('all')}
            >
              جميع الروايات
            </span>
          </label>
          {Object.values(Riwaya).map((riwaya) => (
            <label
              key={riwaya}
              className="inline-flex flex-row-reverse items-center"
            >
              <input
                type="radio"
                className="h-4 w-4 cursor-pointer appearance-none rounded-full border border-gray-300 transition-colors checked:border-brand-CTA-blue-500 checked:bg-brand-CTA-blue-500"
                name="riwaya"
                value={riwaya}
                checked={selectedRiwaya === riwaya}
                onChange={() => setSelectedRiwaya(riwaya)}
              />
              <span
                className="mx-1 cursor-pointer"
                onClick={() => setSelectedRiwaya(riwaya)}
              >
                {riwaya}
              </span>
            </label>
          ))}
        </div>
        {filteredReciters
          .filter((reciter) => reciter.name.includes(searchTerm))
          .sort((a, b) =>
            a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' })
          )
          .map((reciter) => (
            <button
              key={reciter.id}
              className="w-full flex-1 cursor-pointer rounded-lg border border-gray-200 p-2 shadow-md transition-transform hover:scale-105 dark:border-gray-400"
              onClick={() => selectedReciterClickHandler(reciter)}
            >
              <h2 className="font-semibol mb-2 text-right text-xl">
                {reciter.name}
              </h2>
              <p className="mb-1 text-right">{`برواية ${reciter.riwaya}`}</p>
            </button>
          ))}
      </div>
    </section>
  );
}
