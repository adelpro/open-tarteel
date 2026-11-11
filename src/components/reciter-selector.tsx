'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { FaRegShareFromSquare } from 'react-icons/fa6';
import { MdCloudDone, MdExpandMore } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { useFavorites } from '@/hooks/use-favorites';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import {
  reciterListOpenAtom,
  reciterListPinnedAtom,
  selectedReciterAtom,
} from '@/jotai/atom';
import type { Reciter } from '@/types';
import { generateFavId } from '@/utils';
import { useShareReciter } from '@/utils/share';

import ReciterSelectorDialog from './reciter-selector-dialog';

type Props = {
  /** Server-resolved reciter, so the selector paints at its final height. */
  initialReciter?: Reciter;
};

export default function ReciterSelector({ initialReciter }: Props) {
  const [isOpen, setIsOpen] = useAtom(reciterListOpenAtom);
  const [mounted, setMounted] = useState(false);
  const autoOpenedRef = useRef(false);

  const selectedReciter = useAtomValue(selectedReciterAtom);
  const pinned = useAtomValue(reciterListPinnedAtom);
  const { toggleFavorite, favoriteReciters } = useFavorites();
  const { formatMessage } = useIntl();
  const { shareReciter } = useShareReciter();
  const { isAllCached } = useOfflineDownload();

  useEffect(() => {
    setMounted(true);

    // Auto-open dialog if there's a search query in URL (only once). Reading
    // the URL here instead of useSearchParams keeps the selector out of a
    // Suspense boundary, so it is present on the server and cannot shift in.
    const searchQuery = new URLSearchParams(window.location.search).get(
      'query'
    );
    if (searchQuery && searchQuery.trim() !== '' && !autoOpenedRef.current) {
      setIsOpen(true);
      autoOpenedRef.current = true;
    }
  }, [setIsOpen]);

  // A pinned panel is a preference. Reopen it after a reload on desktop, but
  // let the user close it during the session without forcing it back.
  useEffect(() => {
    if (!pinned) return;
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setIsOpen(true);
    }
  }, [pinned, setIsOpen]);

  const displayedReciter = selectedReciter ?? initialReciter;
  const playlist = displayedReciter?.moshaf?.playlist ?? null;

  // Only compute after mount to avoid hydration mismatch
  const allCached = mounted && playlist ? isAllCached(playlist) : false;

  const handleSearch = () => setIsOpen(true);

  const displayedReciterName =
    displayedReciter?.name ??
    formatMessage({
      id: 'reciter.select',
      defaultMessage: 'Select A Reciter',
    });

  const moshafName =
    displayedReciter?.moshaf?.name ??
    formatMessage({
      id: 'reciter.selectHint',
      defaultMessage: 'Choose a reciter to start listening',
    });

  const favId = displayedReciter ? generateFavId(displayedReciter) : null;
  const isFavorite = favId ? favoriteReciters.includes(favId) : false;

  const handleShare = async (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    if (displayedReciter) shareReciter(displayedReciter);
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
          {displayedReciter && playlist && allCached ? (
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

          {displayedReciter ? (
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

          {displayedReciter && favId ? (
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
