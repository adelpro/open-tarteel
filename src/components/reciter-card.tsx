'use client';

import React from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { MdHistory } from 'react-icons/md';

import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { Reciter, Riwaya } from '@/types';
import { generateFavId } from '@/utils';
import { useShareReciter } from '@/utils/share';

type Props = {
  reciter: Reciter;
  favoriteCount: number;
  viewCount: number;
  index: number;
  isFavorite: boolean;
  isFocused: boolean;
  onSelect: (reciter: Reciter) => void;
  onFavoriteToggle: () => void;
  onSelectRiwaya: (riwaya: Riwaya | 'all') => void;
  refCallback: (element: HTMLDivElement | null) => void;
};

export default function ReciterCard({
  reciter,
  favoriteCount,
  viewCount,
  isFavorite,
  isFocused,
  onSelect,
  onFavoriteToggle,
  refCallback,
}: Props) {
  const { shareReciter } = useShareReciter();
  const { recentIds } = useRecentlyPlayed();

  const favId = generateFavId(reciter);
  const isRecentlyPlayed = recentIds.includes(favId);

  const handleShare = (event: React.MouseEvent) => {
    event.stopPropagation();
    shareReciter(reciter);
  };

  return (
    <div
      ref={refCallback}
      onClick={() => onSelect(reciter)}
      className={`relative cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
        isFocused
          ? 'bg-brand-CTA-blue-50/30 border-brand-CTA-blue-500 ring-2 ring-brand-CTA-blue-500/20'
          : 'hover:border-brand-CTA-blue-200 border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 overflow-hidden text-right">
            <h3 className="mb-1 truncate text-lg font-bold text-gray-900 dark:text-gray-100">
              {reciter.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {reciter.moshaf.name}
            </p>
          </div>

          {isRecentlyPlayed && (
            <div className="bg-brand-CTA-blue-50 dark:bg-brand-CTA-blue-900/40 dark:text-brand-CTA-blue-400 border-brand-CTA-blue-100 dark:border-brand-CTA-blue-800 flex shrink-0 items-center gap-1 self-start rounded-md border px-2 py-1 text-[10px] font-bold text-brand-CTA-blue-600">
              <MdHistory size={12} />
              <span>RECENT</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-2 dark:border-gray-700/50">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <BsStarFill className="text-yellow-400" />
              <span>{favoriteCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Views: {viewCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              <FaRegShareFromSquare size={18} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onFavoriteToggle();
              }}
              className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isFavorite ? (
                <BsStarFill size={20} className="text-yellow-400" />
              ) : (
                <BsStar size={20} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
