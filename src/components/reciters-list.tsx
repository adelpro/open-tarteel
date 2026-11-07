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
import { MdClose, MdCloudDone, MdSearch } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { SOURCE_LABEL_IDS } from '@/constants';
import {
  fetchViewCounts,
  subscribeToViewCounts,
  syncView,
} from '@/gun/view-rank';
import { useFavorites } from '@/hooks/use-favorites';
import { useFilterSort } from '@/hooks/use-filter-sort';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { useRecentlyPlayed } from '@/hooks/use-recently-played';
import { useReciters } from '@/hooks/use-reciters';
import { enabledSourcesAtom, selectedReciterAtom } from '@/jotai/atom';
import { canDownload } from '@/services/reciters/capabilities';
import { LinkSource, Reciter } from '@/types';
import { cn, generateFavId } from '@/utils';

import Sheet from './sheet';
import SimpleSkeleton from './simple-skeleton';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const PAGE_SIZE = 80;

const chip =
  'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors';

export default function RecitersList({ isOpen, setIsOpen }: Props) {
  const router = useRouter();
  const { formatMessage } = useIntl();
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const { recentIds, addToRecent } = useRecentlyPlayed();
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [showDownloadedOnly, setShowDownloadedOnly] = useState(false);
  const [showDownloadableOnly, setShowDownloadableOnly] = useState(false);
  const [pinned, setPinned] = useState(false);
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
    selectedRiwaya,
    setSelectedRiwaya,
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
    selectedRiwaya,
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

  const toggleSource = useCallback(
    (source: LinkSource) => {
      setSelectedSources(
        selectedSources.includes(source)
          ? selectedSources.filter((value) => value !== source)
          : [...selectedSources, source]
      );
    },
    [selectedSources, setSelectedSources]
  );

  const handleSelectReciter = useCallback(
    (reciter: Reciter) => {
      const favId = generateFavId(reciter);
      addToRecent(favId);
      syncView(favId);
      setSelectedReciter(reciter);
      if (!pinned) setIsOpen(false);

      const parameters = new URLSearchParams(window.location.search);
      const moshafParameter = `moshafId=${reciter.moshaf.id}`;
      const existingParameters = parameters.toString();
      const queryString = existingParameters
        ? `${moshafParameter}&${existingParameters}`
        : moshafParameter;

      router.push(`/reciter/${reciter.id}?${queryString}`);
    },
    [addToRecent, pinned, router, setIsOpen, setSelectedReciter]
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

  const scopeChip = (
    active: boolean,
    label: string,
    onClick: () => void,
    key: string
  ) => (
    <button
      key={key}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        chip,
        active
          ? 'border-transparent bg-brand-CTA-blue-600 text-white'
          : 'hover:bg-border/40 border-border bg-surface text-foreground'
      )}
    >
      {label}
    </button>
  );

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

      <div className="flex gap-2 overflow-x-auto px-4 py-2 lg:flex-wrap lg:overflow-visible">
        <button
          type="button"
          aria-pressed={selectedSources.length === 0}
          onClick={() => setSelectedSources([])}
          className={cn(
            chip,
            selectedSources.length === 0
              ? 'border-transparent bg-brand-CTA-blue-600 text-white'
              : 'hover:bg-border/40 border-border bg-surface text-foreground'
          )}
        >
          {formatMessage({
            id: 'filter.allSources',
            defaultMessage: 'All sources',
          })}
        </button>
        {availableSources.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selectedSources.includes(value)}
            onClick={() => toggleSource(value)}
            className={cn(
              chip,
              selectedSources.includes(value)
                ? 'border-transparent bg-brand-CTA-blue-600 text-white'
                : 'hover:bg-border/40 border-border bg-surface text-foreground'
            )}
          >
            {label}
          </button>
        ))}
        <span aria-hidden="true" className="my-1 w-px shrink-0 bg-border" />
        <button
          type="button"
          aria-pressed={selectedRiwaya === 'all'}
          onClick={() => setSelectedRiwaya('all')}
          className={cn(
            chip,
            selectedRiwaya === 'all'
              ? 'border-transparent bg-brand-CTA-blue-600 text-white'
              : 'hover:bg-border/40 border-border bg-surface text-foreground'
          )}
        >
          {formatMessage({
            id: 'filter.allRiwiyat',
            defaultMessage: 'All riwayas',
          })}
        </button>
        {availableRiwiyat.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={selectedRiwaya === value}
            onClick={() => setSelectedRiwaya(value)}
            className={cn(
              chip,
              selectedRiwaya === value
                ? 'border-transparent bg-brand-CTA-blue-600 text-white'
                : 'hover:bg-border/40 border-border bg-surface text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 py-2">
        {scopeChip(
          showRecentOnly,
          formatMessage({ id: 'reciter.recent', defaultMessage: 'Recent' }),
          () => setShowRecentOnly((value) => !value),
          'recent'
        )}
        {scopeChip(
          showOnlyFavorites,
          formatMessage({
            id: 'filter.favorites',
            defaultMessage: 'Favorites',
          }),
          () => setShowOnlyFavorites(!showOnlyFavorites),
          'favorites'
        )}
        {isOnline &&
          scopeChip(
            showDownloadedOnly,
            formatMessage({
              id: 'filter.downloaded',
              defaultMessage: 'Downloaded',
            }),
            () => setShowDownloadedOnly((value) => !value),
            'downloaded'
          )}
        {scopeChip(
          showDownloadableOnly,
          formatMessage({
            id: 'filter.downloadable',
            defaultMessage: 'Downloadable',
          }),
          () => setShowDownloadableOnly((value) => !value),
          'downloadable'
        )}
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
          className={cn(
            chip,
            'hover:bg-border/40 ms-auto border-border bg-surface text-foreground'
          )}
        >
          {sortLabel}
        </button>
        <span className="tnum w-full text-[11px] text-muted">
          {filteredReciters.length}{' '}
          {formatMessage({
            id: 'reciterDialog.count',
            defaultMessage: 'reciters',
          })}
        </span>
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
            const current = selectedReciter?.id === reciter.id;
            const downloaded = isReciterDownloaded(
              reciter.id,
              reciter.moshaf.id
            );

            return (
              <li key={favId} className="border-border/60 border-b">
                <div className="flex w-full min-w-0 items-center">
                  <button
                    type="button"
                    onClick={() => handleSelectReciter(reciter)}
                    aria-current={current ? 'true' : undefined}
                    className="hover:bg-border/30 flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-start transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-base text-foreground',
                          current && 'font-semibold'
                        )}
                      >
                        {reciter.name}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] text-muted">
                        <span className="min-w-0 flex-1 truncate">
                          {reciter.moshaf.name}
                        </span>
                        {downloaded && (
                          <MdCloudDone
                            className="size-3.5 shrink-0 text-green-500"
                            aria-hidden="true"
                          />
                        )}
                        <span className="tnum inline-flex shrink-0 items-center gap-0.5">
                          <BsStarFill
                            className="size-3 text-yellow-400"
                            aria-hidden="true"
                          />
                          {favoriteCounts[favId] ?? 0}
                        </span>
                        <span className="tnum shrink-0">
                          {viewCounts[favId] ?? 0}{' '}
                          {formatMessage({
                            id: 'views',
                            defaultMessage: 'views',
                          })}
                        </span>
                      </span>
                    </span>
                    <span className="bg-border/60 shrink-0 rounded-full px-2 py-1 text-[10px] text-foreground">
                      {formatMessage({
                        id: SOURCE_LABEL_IDS[reciter.source],
                      })}
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
                    className="hover:bg-border/40 me-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
                  >
                    {isFavorite ? (
                      <BsStarFill className="size-5 text-yellow-400" />
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
