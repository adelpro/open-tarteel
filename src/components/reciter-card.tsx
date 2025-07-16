'use client';

import { BsStar, BsStarFill } from 'react-icons/bs';

import { Reciter, Riwaya } from '@/types';

type Props = {
  reciter: Reciter;
  index: number;
  isFavorite: boolean;
  isFocused: boolean;
  globalCount: number;
  refCallback: (element: HTMLButtonElement | null) => void;
  onSelect: (reciter: Reciter) => void;
  onFavoriteToggle: (reciter: Reciter) => void;
  onSelectRiwaya: (riwaya: Riwaya) => void;
};

export default function ReciterCard({
  reciter,
  isFavorite,
  isFocused,
  globalCount,
  refCallback,
  onSelect,
  onFavoriteToggle,
  onSelectRiwaya,
}: Props) {
  const riwaya = reciter.moshaf.riwaya || Riwaya.Warsh;

  return (
    <button
      ref={refCallback}
      onClick={() => onSelect(reciter)}
      className={`relative flex w-full flex-col items-start justify-between rounded-xl border border-gray-200 p-5 text-right shadow-md transition-all hover:scale-[1.02] hover:shadow-lg ${
        isFocused ? 'scale-[1.02] transform ring-2 ring-blue-500' : ''
      } ${isFavorite ? 'ring-1 ring-yellow-200 dark:ring-yellow-800' : ''}`}
    >
      <h2 className="mb-1 text-xl font-semibold">{reciter.name}</h2>

      <span className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        التقييم العام: {globalCount}
      </span>

      <div className="flex w-full items-center justify-between">
        <div className="flex gap-2">
          <span
            role="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectRiwaya(riwaya);
            }}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            {riwaya}
          </span>
        </div>

        <div
          role="button"
          tabIndex={0}
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavoriteToggle(reciter);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              onFavoriteToggle(reciter);
            }
          }}
          className={`absolute left-3 top-3 cursor-pointer rounded-full p-1 transition-colors ${
            isFavorite
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-400 hover:text-yellow-500 dark:text-gray-500 dark:hover:text-yellow-400'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <BsStarFill className="h-6 w-6" />
          ) : (
            <BsStar className="h-6 w-6" />
          )}
        </div>
      </div>
    </button>
  );
}
