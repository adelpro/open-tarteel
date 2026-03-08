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
      className={[
        'group relative flex w-full cursor-pointer flex-col rounded-2xl border p-6',
        'bg-surface transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        isFocused
          ? 'ring-accent/20·shadow-md·ring-2 border-accent'
          : isFavorite
            ? 'border-amber-300/60 bg-amber-50/20 dark:bg-amber-900/10'
            : 'border-border hover:border-zinc-300 hover:shadow-md dark:hover:border-slate-600',
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <h2 className="pr-2 text-lg font-semibold leading-tight">
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
      <div className="mb-6 flex items-center gap-4 text-sm">
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
          className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {riwayaKey}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="rounded-full p-1.5 text-zinc-400 transition-all duration-200 hover:scale-110 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          aria-label="Share reciter"
        >
          <BsShare className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
