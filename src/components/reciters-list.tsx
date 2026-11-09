'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import {
  MdClose,
  MdCloudDone,
  MdExpandMore,
  MdSearch,
  MdVisibility,
} from 'react-icons/md';
import { useIntl } from 'react-intl';

import { SOURCE_LABEL_IDS } from '@/constants';
import {
  fetchViewCounts,
  subscribeToViewCounts,
  syncView,
} from '@/gun/view-rank';
import { useFavorites } from '@/hooks/use-favorites';
import { useFilterSort } from '@/hooks/use-filter-sort';
import { useLocalePath } from '@/hooks/use-locale-path';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { useReciters } from '@/hooks/use-reciters';
import { enabledSourcesAtom, selectedReciterAtom } from '@/jotai/atom';
import { canDownload } from '@/services/reciters/capabilities';
import { Reciter } from '@/types';
import { cn, generateFavId } from '@/utils';

import ReciterFilters from './reciter-filters';
import Sheet from './sheet';
import SimpleSkeleton from './simple-skeleton';
import Segmented from './ui/segmented';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const PAGE_SIZE = 80;

export default function RecitersList({ isOpen, setIsOpen }: Props) {
  const router = useRouter();
  const localePath = useLocalePath();
  const { formatMessage } = useIntl();
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  // A reciter can appear once per moshaf/riwaya, so the reciter id alone is
  // not unique in this list. Match the same identity used for favourites.
  const selectedFavId = selectedReciter
    ? generateFavId(selectedReciter)
    : null;
  const { recentIds, addToRecent } = useRecentlyPlayed();
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);
  const [showDownloadableOnly, setShowDownloadableOnly] = useState(false);
  const [pinned, setPinned] = useState(false);
  const skipHistoryBack = useRef(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLLIElement>(null);

  const isOnline = useNetworkStatus();
  const isDownloadedOnlyEffective = showDownloadedOnly || !isOnline;
  const { reciters, loading, error } = useReciters();
  const { isReciterDownloaded } = useOfflineDownload();
  const enabledSources = useAtomValue(enabledSourcesAtom);
  const recitersBySource = useMemo(
    () =>
      reciters.filter((r) =>
        enabledSources.length > 0 ? enabledSources.includes(r.source) : true
      ),
    [reciters, enabledSources]
  );

  const {
    favoriteReciters,
    favoriteCounts,
    toggleFavorite,
    showOnlyFavorites,
    setShowOnlyFavorites,
  } = useFavorites();

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchViewCounts().then(setViewCounts);
    const unsubscribe = subscribeToViewCounts(setViewCounts);
    return () => unsubscribe();
  }, []);

  const {
    searchTerm,
    setSearchTerm,
    selectedRiwiyat,
    setSelectedRiwiyat,
    selectedSources,
    setSelectedSources,
    sortMode,
    setSortMode,
    filteredReciters: baseFilteredReciters,
    availableRiwiyat,
    availableSources,
  } = useFilterSort({
    reciters: recitersBySource,
    favoriteCounts,
    viewCounts,
    favoriteReciters,
    showOnlyFavorites,
  });

  const filteredReciters = useMemo(() => {
    let result = baseFilteredReciters;
    if (showRecentOnly) {
      result = result
        .filter((r) => recentIds.includes(generateFavId(r)))
        .sort(
          (a, b) =>
            recentIds.indexOf(generateFavId(a)) -
            recentIds.indexOf(generateFavId(b))
        );
    }
    if (isDownloadedOnlyEffective) {
      result = result.filter((r) => isReciterDownloaded(r.id, r.moshaf.id));
    }
    if (showDownloadableOnly) {
      result = result.filter((r) => canDownload(r.source));
    }
    return result;
  }, [
    baseFilteredReciters,
    showRecentOnly,
    recentIds,
    isDownloadedOnlyEffective,
    isReciterDownloaded,
    showDownloadableOnly,
  ]);

  // A filter change starts the list from the top again.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    searchTerm,
    selectedRiwiyat,
    selectedSources,
    sortMode,
    showRecentOnly,
    showDownloadedOnly,
    showDownloadableOnly,
  ]);

  useEffect(() => {
    if (!isOpen || filteredReciters.length <= visibleCount) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + PAGE_SIZE, filteredReciters.length)
          );
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, filteredReciters.length, visibleCount]);

  useEffect(() => {
    if (loading || recitersBySource.length === 0) return;
    const available = new Set(recitersBySource.map((r) => r.source));
    const next = selectedSources.filter((source) => available.has(source));
    if (next.length !== selectedSources.length) {
      setSelectedSources(next);
    }
  }, [loading, recitersBySource, selectedSources, setSelectedSources]);

  const favoriteRecitersList = useMemo(
    () =>
      recitersBySource.filter((r) =>
        favoriteReciters.includes(generateFavId(r))
      ),
    [recitersBySource, favoriteReciters]
  );

  useEffect(() => {
    if (favoriteRecitersList.length === 0) {
      setShowOnlyFavorites(false);
    }
  }, [favoriteRecitersList.length, setShowOnlyFavorites]);

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      const favId = generateFavId(reciter);
      addToRecent(favId);
      syncView(favId);
      setSelectedReciter(reciter);
      if (!pinned) {
        skipHistoryBack.current = true;
        setIsOpen(false);
      }

      const parameters = new URLSearchParams(window.location.search);
      parameters.delete('moshafId');
      const moshafParameter = `moshafId=${reciter.moshaf.id}`;
      const existingParameters = parameters.toString();
      const queryString = existingParameters
        ? `${moshafParameter}&${existingParameters}`
        : moshafParameter;

      router.push(localePath(`/reciter/${reciter.id}?${queryString}`));
    },
    [addToRecent, localePath, pinned, router, setIsOpen, setSelectedReciter]
  );

  const sortLabel =
    sortMode === 'alphabetical'
      ? formatMessage({
          id: 'sort.byAlphabet',
          defaultMessage: 'Sort by Alphabet',
        })
      : sortMode === 'views'
        ? formatMessage({ id: 'sort.byViews', defaultMessage: 'Sort by Views' })
        : formatMessage({
            id: 'sort.byFavorite',
            defaultMessage: 'Sort by Favorite',
          });

  const sortShortLabel =
    sortMode === 'alphabetical'
      ? 'A–Z'
      : sortMode === 'views'
        ? formatMessage({ id: 'sort.shortViews', defaultMessage: 'Views' })
        : formatMessage({ id: 'sort.shortPopular', defaultMessage: 'Popular' });

  const scope = isDownloadedOnlyEffective
    ? 'downloaded'
    : showRecentOnly
      ? 'recent'
      : showOnlyFavorites
        ? 'favorites'
        : 'all';

  const setScope = (value: string) => {
    if (!isOnline && value !== 'downloaded') return;
    setShowRecentOnly(value === 'recent');
    setShowOnlyFavorites(value === 'favorites');
    setShowDownloadedOnly(value === 'downloaded');
  };

  const toolbar = (
    <div className="shrink-0 border-b border-border">
      <div className="flex min-h-11 items-center gap-3 border-b border-border px-4">
        <MdSearch className="size-5 shrink-0 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={formatMessage({
            id: 'searchPlaceHolder',
            defaultMessage: 'Search A Reciter',
          })}
          aria-label={formatMessage({
            id: 'searchPlaceHolder',
            defaultMessage: 'Search A Reciter',
          })}
          className="min-h-11 w-full min-w-0 border-0 bg-transparent py-2 text-base text-foreground shadow-none placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            aria-label={formatMessage({
              id: 'common.clear',
              defaultMessage: 'Clear search',
            })}
            className="-me-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:text-foreground"
          >
            <MdClose className="size-5" />
          </button>
        )}
      </div>

      <div className="space-y-2 px-4 py-2">
        <Segmented
          value={scope}
          onChange={setScope}
          label={formatMessage({
            id: 'filter.scope',
            defaultMessage: 'Reciter scope',
          })}
          options={[
            {
              value: 'all',
              label: formatMessage({ id: 'filter.all', defaultMessage: 'All' }),
              disabled: !isOnline,
            },
            {
              value: 'recent',
              label: formatMessage({
                id: 'reciter.recent',
                defaultMessage: 'Recent',
              }),
              disabled: !isOnline,
            },
            {
              value: 'favorites',
              label: formatMessage({
                id: 'filter.favorites',
                defaultMessage: 'Favorites',
              }),
              disabled: !isOnline,
            },
            {
              value: 'downloaded',
              label: formatMessage({
                id: 'filter.downloaded',
                defaultMessage: 'Downloaded',
              }),
            },
          ]}
        />

        <div className="flex items-center gap-2">
          <ReciterFilters
            availableSources={availableSources}
            availableRiwiyat={availableRiwiyat}
            selectedSources={selectedSources}
            selectedRiwiyat={selectedRiwiyat}
            onSourcesChange={setSelectedSources}
            onRiwiyatChange={setSelectedRiwiyat}
            downloadableOnly={showDownloadableOnly}
            onDownloadableOnlyChange={setShowDownloadableOnly}
            resultCount={filteredReciters.length}
          />

          <button
            type="button"
            onClick={() =>
              setSortMode((previous) =>
                previous === 'popular'
                  ? 'alphabetical'
                  : previous === 'alphabetical'
                    ? 'views'
                    : 'popular'
              )
            }
            aria-label={sortLabel}
            className="flex h-10 items-center gap-1 rounded-[8px] border border-border bg-surface px-3 text-[13px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
          >
            <span>{sortShortLabel}</span>
            <MdExpandMore
              className="size-4 text-ink-muted"
              aria-hidden="true"
            />
          </button>

          <span className="ms-auto text-[12px] tabular-nums text-ink-muted">
            {filteredReciters.length}{' '}
            {formatMessage({
              id: 'reciterDialog.count',
              defaultMessage: 'reciters',
            })}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet
      title={formatMessage({
        id: 'reciterDialog.title',
        defaultMessage: 'Select a Reciter',
      })}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      toolbar={toolbar}
      pinned={pinned}
      onTogglePin={() => setPinned((value) => !value)}
      skipHistoryBack={skipHistoryBack}
    >
      {error && filteredReciters.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-red-500">{error}</p>
      ) : loading && filteredReciters.length === 0 ? (
        <div className="p-4">
          <SimpleSkeleton />
        </div>
      ) : filteredReciters.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          {isOnline
            ? formatMessage({
                id: 'noRecitersFound',
                defaultMessage: 'No reciters found.',
              })
            : formatMessage({
                id: 'offline.noDownloadedReciters',
                defaultMessage:
                  'No downloaded reciters found. Connect to the internet to browse and download reciters.',
              })}
        </p>
      ) : (
        <ul>
          {filteredReciters.slice(0, visibleCount).map((reciter) => {
            const favId = generateFavId(reciter);
            const isFavorite = favoriteReciters.includes(favId);
            const current = selectedFavId === favId;
            const downloaded = isReciterDownloaded(
              reciter.id,
              reciter.moshaf.id
            );

            return (
              <li key={favId} className="border-b border-border">
                <div className="flex w-full min-w-0 items-center">
                  <button
                    type="button"
                    onClick={() => handleSelectReciter(reciter)}
                    aria-current={current ? 'true' : undefined}
                    className={cn(
                      'flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-start transition-colors hover:bg-surface-sunken',
                      current && 'bg-primary-soft'
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[16px] text-foreground',
                          current && 'font-bold'
                        )}
                      >
                        {reciter.name}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-[12px] text-muted">
                        <span className="min-w-0 truncate">
                          {reciter.moshaf.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0 text-[11px]">
                          {formatMessage({
                            id: SOURCE_LABEL_IDS[reciter.source],
                          })}
                        </span>
                        {downloaded && (
                          <MdCloudDone
                            className="size-3.5 shrink-0 text-success"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </span>
                    <span className="flex w-12 shrink-0 flex-col items-end gap-1 text-[11px] leading-none text-muted">
                      <span className="flex items-center justify-end gap-1">
                        <BsStarFill
                          className="size-3 shrink-0 text-mark"
                          aria-hidden="true"
                        />
                        <span className="tnum w-5 text-end">
                          {favoriteCounts[favId] ?? 0}
                        </span>
                      </span>
                      <span
                        className="flex items-center justify-end gap-1"
                        title={formatMessage({
                          id: 'views',
                          defaultMessage: 'views',
                        })}
                      >
                        <MdVisibility
                          className="size-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="tnum w-5 text-end">
                          {viewCounts[favId] ?? 0}
                        </span>
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(favId)}
                    aria-label={
                      isFavorite
                        ? formatMessage({
                            id: 'favorites',
                            defaultMessage: 'favorites',
                          })
                        : formatMessage({
                            id: 'favorites',
                            defaultMessage: 'favorites',
                          })
                    }
                    aria-pressed={isFavorite}
                    className="me-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
                  >
                    {isFavorite ? (
                      <BsStarFill className="size-5 text-mark" />
                    ) : (
                      <BsStar className="size-5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
          {visibleCount < filteredReciters.length && (
            <li ref={sentinelRef} className="h-px" aria-hidden="true" />
          )}
        </ul>
      )}
    </Sheet>
  );
}
