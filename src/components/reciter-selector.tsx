'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { MdCloudDone, MdExpandMore } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { useFavorites } from '@/hooks/use-favorites';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { reciterListOpenAtom, selectedReciterAtom } from '@/jotai/atom';
import { generateFavId } from '@/utils';
import { useShareReciter } from '@/utils/share';

import ReciterSelectorDialog from './reciter-selector-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useAtom(reciterListOpenAtom);
  const [mounted, setMounted] = useState(false);
  const autoOpenedRef = useRef(false);

  const selectedReciter = useAtomValue(selectedReciterAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();
  const { formatMessage } = useIntl();
  const { shareReciter } = useShareReciter();
  const { isAllCached } = useOfflineDownload();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);

    // Auto-open dialog if there's a search query in URL (only once)
    const searchQuery = searchParams.get('query');
    if (searchQuery && searchQuery.trim() !== '' && !autoOpenedRef.current) {
      setIsOpen(true);
      autoOpenedRef.current = true;
    }
  }, [searchParams, setIsOpen]);

  const playlist = selectedReciter?.moshaf?.playlist ?? null;

  // Only compute after mount to avoid hydration mismatch
  const allCached = mounted && playlist ? isAllCached(playlist) : false;

  if (!mounted) {
    return (
      <div className="flex w-full justify-center">
        <div className="flex min-h-16 w-full max-w-lg items-center rounded-2xl border border-border bg-surface p-1.5">
          <span className="h-4 w-40 animate-pulse rounded-full bg-surface-sunken" />
        </div>
      </div>
    );
  }

  const handleSearch = () => setIsOpen(true);

  const displayedReciterName =
    selectedReciter?.name ??
    formatMessage({
      id: 'reciter.select',
      defaultMessage: 'Select A Reciter',
    });

  const moshafName =
    selectedReciter?.moshaf?.name ??
    formatMessage({
      id: 'reciter.selectHint',
      defaultMessage: 'Choose a reciter to start listening',
    });

  const favId = selectedReciter ? generateFavId(selectedReciter) : null;
  const isFavorite = favId ? favoriteReciters.includes(favId) : false;

  const handleShare = async (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    if (selectedReciter) shareReciter(selectedReciter);
  };

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-lg items-center gap-1 rounded-2xl border border-border bg-surface p-1.5">
        <button
          type="button"
          onClick={handleSearch}
          aria-label={formatMessage({
            id: 'reciter.openSelector',
            defaultMessage: 'Open reciter selector',
          })}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[10px] px-3 py-1.5 text-start transition-colors duration-120 hover:bg-surface-sunken"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[16px] font-bold text-ink">
              {displayedReciterName}
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
              {moshafName}
            </span>
          </span>
          <MdExpandMore
            className="size-5 shrink-0 text-ink-muted"
            aria-hidden="true"
          />
        </button>

        <div className="flex shrink-0 items-center">
          {selectedReciter && playlist && allCached ? (
            <span
              className="flex size-11 items-center justify-center text-success"
              title={formatMessage({
                id: 'download.allSaved',
                defaultMessage: 'All surahs saved offline',
              })}
            >
              <MdCloudDone
                size={20}
                aria-label={formatMessage({
                  id: 'download.allSaved',
                  defaultMessage: 'All surahs saved offline',
                })}
              />
            </span>
          ) : null}

          {selectedReciter ? (
            <button
              type="button"
              onClick={handleShare}
              aria-label={formatMessage({
                id: 'reciter.share',
                defaultMessage: 'Share reciter',
              })}
              className="flex size-11 items-center justify-center rounded-[10px] text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
            >
              <FaRegShareFromSquare size={20} aria-hidden="true" />
            </button>
          ) : null}

          {selectedReciter && favId ? (
            <button
              type="button"
              onClick={() => toggleFavorite(favId)}
              aria-pressed={isFavorite}
              aria-label={formatMessage({
                id: 'favorites',
                defaultMessage: 'favorites',
              })}
              className="flex size-11 items-center justify-center rounded-[10px] text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
            >
              {isFavorite ? (
                <BsStarFill
                  size={20}
                  className="text-mark"
                  aria-hidden="true"
                />
              ) : (
                <BsStar size={20} aria-hidden="true" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
