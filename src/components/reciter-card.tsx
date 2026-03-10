'use client';

import React from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { MdHistory } from 'react-icons/md';
import { FormattedMessage } from 'react-intl';

import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { LinkSource, Reciter, Riwaya } from '@/types';
import { cn, generateFavId } from '@/utils';
import { useShareReciter } from '@/utils/share';

const SOURCE_LABEL_IDS: Partial<Record<LinkSource, string>> = {
  [LinkSource.MP3QURAN]: 'settings.source.mp3quran',
  [LinkSource.ITQAN]: 'settings.source.itqan',
};

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
      role="button"
      tabIndex={0}
      ref={refCallback}
      onClick={() => onSelect(reciter)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(reciter);
        }
      }}
      className={cn(
        'relative w-full rounded-2xl border p-4 text-right transition-all duration-300',
        'hover:border-brand-CTA-blue-200 border-gray-100 bg-white hover:scale-[103%]',
        'dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-400',
        'p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-CTA-blue-500 focus-visible:ring-offset-2'
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 overflow-hidden text-right">
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 self-start">
              {SOURCE_LABEL_IDS[reciter.source] && (
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500"
                  title={reciter.source}
                >
                  <FormattedMessage
                    id={SOURCE_LABEL_IDS[reciter.source]}
                    defaultMessage={reciter.source}
                  />
                </span>
              )}
              {isRecentlyPlayed && (
                <div className="bg-brand-CTA-blue-50 dark:bg-brand-CTA-blue-900/40 dark:text-brand-CTA-blue-400 border-brand-CTA-blue-100 dark:border-brand-CTA-blue-800 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold text-brand-CTA-blue-600">
                  <MdHistory size={12} />
                  <FormattedMessage
                    id="reciter.recent"
                    defaultMessage="Recent"
                  />
                </div>
              )}
            </div>
            <h3 className="mb-1 truncate text-lg font-bold text-gray-900 dark:text-gray-100">
              {reciter.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {reciter.moshaf.name}
            </p>
          </div>
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
