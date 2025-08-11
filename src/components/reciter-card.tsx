'use client';

import { BsEye, BsShare, BsStar, BsStarFill } from 'react-icons/bs';
import { FormattedMessage } from 'react-intl';

import { Reciter, Riwaya } from '@/types';
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
      className={`group relative flex w-full cursor-pointer flex-col items-start justify-between rounded-lg border border-gray-200 bg-white p-4 text-right shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/50 ${
        isFocused
          ? 'border-brand-CTA-blue-500 ring-2 ring-brand-CTA-blue-500'
          : ''
      } ${isFavorite ? 'border-yellow-400 ring-2 ring-yellow-400' : ''} dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:focus:border-brand-CTA-blue-500`}
    >
      <h2 className="mb-3 truncate text-lg font-semibold text-gray-900 dark:text-white">
        {reciter.name}
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-1 text-sm">
        <span className="flex items-center gap-0.5 font-medium text-gray-600 dark:text-gray-400">
          <BsStar className="mr-2.5 h-4 w-4 flex-shrink-0" />
          {favoriteCount}
        </span>
        <span className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
          <BsEye className="mr-2.5 h-4 w-4 flex-shrink-0" />
          {viewCount}
        </span>
      </div>

      <div className="flex w-full items-center justify-between">
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            onSelectRiwaya(riwaya);
          }}
          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          <FormattedMessage
            id={`riwaya.${riwayaKey}` || 'riwaya.Hafs'}
            defaultMessage="Hafs"
          />
        </span>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="absolute bottom-4 end-4 cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-300 dark:focus:ring-gray-600"
          aria-label="Share reciter"
        >
          <BsShare className="h-4 w-4" />
        </button>

        {/* Favorite */}
        <button
          type="button"
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavoriteToggle(reciter);
          }}
          className={`absolute end-4 top-4 cursor-pointer rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 ${
            isFavorite
              ? 'text-yellow-500 hover:bg-yellow-50 focus:ring-yellow-200 dark:hover:bg-yellow-900/30'
              : 'text-gray-400 hover:bg-yellow-50 hover:text-yellow-500 focus:ring-gray-200 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400'
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
    </div>
  );
}
