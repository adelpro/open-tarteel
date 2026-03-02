'use client';

import Link from 'next/link';
import { BsStarFill } from 'react-icons/bs';
import { MdHistory } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useRecentRecitersData } from '@/hooks/recent-reciters';
import { useViewCounts } from '@/hooks/views-count';
import { Reciter } from '@/types';
import { cn, generateFavId } from '@/utils';

import ShareReciter from './share-reciter';
import ToggleFavoriteReciter from './toggle-favorite-reciter';

type Props = {
  reciter: Reciter;
  isFocused: boolean;
  onSelect: (reciter: Reciter) => void;
  refCallback: (element: HTMLAnchorElement | null) => void;
};

export default function ReciterCard({
  reciter,
  isFocused,
  refCallback,
  onSelect,
}: Readonly<Props>) {
  const { locale } = useIntl();
  const { recentIds } = useRecentRecitersData();
  const viewCounts = useViewCounts();
  const { favoriteCounts } = useFavorites();
  const favId = generateFavId(reciter);

  const viewCount = viewCounts[favId] || 0;
  const favoriteCount = favoriteCounts[favId];

  const isRecentlyPlayed = recentIds.includes(favId);

  return (
    <Link
      ref={refCallback}
      onClick={() => onSelect(reciter)}
      href={`/${locale}/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`}
      className={cn(
        `relative cursor-pointer rounded-2xl border p-4 transition-all duration-300`,
        {
          'bg-brand-CTA-blue-50/30 border-brand-CTA-blue-500 ring-2 ring-brand-CTA-blue-500/20':
            isFocused,
          'hover:border-brand-CTA-blue-200 border-gray-100 bg-white hover:shadow-xl hover:shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600':
            !isFocused,
        }
      )}
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
            <ShareReciter reciter={reciter} />
            <ToggleFavoriteReciter reciter={reciter} />
          </div>
        </div>
      </div>
    </Link>
  );
}
