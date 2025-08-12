'use client';

import type React from 'react';
import { BsEye, BsShare, BsStar, BsStarFill } from 'react-icons/bs';

import type { Reciter, Riwaya } from '@/types';
import { getRiwayaKeyFromValue } from '@/utils/get-riwaya-from-mushaf';
import { useShareReciter } from '@/utils/share';

type Props = {
  reciter: Reciter;
  index: number;
  isFavorite: boolean;
  isFocused: boolean;
  favoriteCount: number;
  viewCount: number;
  refCallback: (element: HTMLElement | null) => void;
  onSelect: (reciter: Reciter) => void;
  onFavoriteToggle: (reciter: Reciter) => void;
  onSelectRiwaya: (riwaya: Riwaya) => void;
};

export default function ReciterCard({
  reciter,
  isFavorite,
  isFocused,
  favoriteCount,
  viewCount,
  refCallback,
  onSelect,
  onFavoriteToggle,
  onSelectRiwaya,
}: Props) {
  const { shareReciter } = useShareReciter();
  const riwaya = reciter.moshaf.riwaya;
  const riwayaKey = getRiwayaKeyFromValue(riwaya);

  const handleShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    shareReciter(reciter);
  };

  return (
    <div
      ref={refCallback}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(reciter)}
      className={`group relative flex w-full cursor-pointer flex-col rounded-2xl border bg-white p-6 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
        isFocused
          ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
          : isFavorite
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-gray-200 hover:border-gray-300'
      } dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600`}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <h2 className="pr-2 text-lg font-semibold leading-tight text-gray-900 dark:text-white">
          {reciter.name}
        </h2>

        <button
          type="button"
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavoriteToggle(reciter);
          }}
          className={`flex-shrink-0 rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            isFavorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
          }`}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? (
            <BsStarFill className="h-4 w-4" />
          ) : (
            <BsStar className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <BsStar className="h-3.5 w-3.5" />
          <span className="font-medium">{favoriteCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BsEye className="h-3.5 w-3.5" />
          <span className="font-medium">{viewCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectRiwaya(riwaya);
          }}
          className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {riwayaKey}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Share reciter"
        >
          <BsShare className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
