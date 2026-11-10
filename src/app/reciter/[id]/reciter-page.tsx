'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import NetworkStatusIndicator from '@/components/network-status-indicator';
import PlayerSkeleton from '@/components/player-skeleton';
import { clearReciterRouteCookie } from '@/components/reciter-route-cookie';
import ReciterSelector from '@/components/reciter-selector';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';
import { LinkSource } from '@/types';
import { buildLocalPlaylist } from '@/utils/build-local-playlist';

const Player = dynamic(() => import('@/components/player'), {
  ssr: false,
  loading: () => <PlayerSkeleton />,
});

function ReciterContent({
  id,
  moshafId,
  initialReciter,
  initialSurah,
}: {
  id: string;
  moshafId?: string;
  initialReciter?: Reciter;
  initialSurah?: number;
}) {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
  const { formatMessage, locale } = useIntl();
  const searchParams = useSearchParams();
  const queryMoshafId = searchParams.get('moshafId') ?? undefined;
  const [mounted, setMounted] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef(0);
  const timingRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The server page already resolved this reciter and playlist. Seed the atom so
  // the selector and the player share the same identity immediately. A stored
  // entry can have an empty playlist (the catalog only carries hints), so also
  // fill that in — otherwise the empty selection masks the server playlist.
  useEffect(() => {
    if (!initialReciter) return;
    const sameReciter =
      selectedReciter?.id === initialReciter.id &&
      selectedReciter.moshaf.id === initialReciter.moshaf.id;
    const storedHasPlaylist =
      (selectedReciter?.moshaf.playlist.length ?? 0) > 0;
    if (
      sameReciter &&
      (storedHasPlaylist || initialReciter.moshaf.playlist.length === 0)
    ) {
      return;
    }
    setSelectedReciter(initialReciter);
  }, [initialReciter, selectedReciter, setSelectedReciter]);

  // A broken reciter must not trap the home redirect on every visit.
  useEffect(() => {
    if (detailError) clearReciterRouteCookie();
  }, [detailError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFullscreen]);

  // Fall back to the server-resolved reciter, then the selected atom, when a
  // link omits `moshafId`.
  const targetMoshafId =
    moshafId ??
    queryMoshafId ??
    initialReciter?.moshaf.id ??
    (id && selectedReciter?.id === id ? selectedReciter.moshaf.id : undefined);

  // Prefer a reciter that actually has a playlist. An empty stored entry must
  // not hide the server-resolved playlist behind a permanent skeleton.
  const storedMatches =
    selectedReciter?.id === id && selectedReciter.moshaf.id === targetMoshafId;
  const storedHasPlaylist =
    storedMatches && (selectedReciter?.moshaf.playlist.length ?? 0) > 0;
  const activeReciter = storedHasPlaylist
    ? selectedReciter
    : (initialReciter ?? (storedMatches ? selectedReciter : undefined));

  const playlistReady = Boolean(
    id &&
    targetMoshafId &&
    activeReciter?.id === id &&
    activeReciter.moshaf.id === targetMoshafId &&
    activeReciter.moshaf.playlist.length > 0
  );

  useEffect(() => {
    if (!id || !targetMoshafId) return;

    // The server already supplied this reciter with its playlist; do not refetch.
    if (
      initialReciter &&
      initialReciter.id === id &&
      initialReciter.moshaf.id === targetMoshafId &&
      initialReciter.moshaf.playlist.length > 0
    ) {
      return;
    }

    // A cached Itqan reciter from before the timing flag existed has a playlist
    // but no `hasTimings`, which would leave Tahfeez enabled for a recitation
    // with no timings. Refresh the detail once in that case.
    const refreshKey = `${id}:${targetMoshafId}`;
    const needsTimingRefresh =
      selectedReciter?.source === LinkSource.ITQAN &&
      selectedReciter.moshaf.hasTimings === undefined &&
      selectedReciter.moshaf.playlist.length > 0 &&
      timingRefreshRef.current !== refreshKey;

    if (playlistReady && !needsTimingRefresh) return;
    if (needsTimingRefresh) timingRefreshRef.current = refreshKey;

    if (
      selectedReciter?.id === id &&
      selectedReciter.moshaf.id === targetMoshafId
    ) {
      const local = buildLocalPlaylist(selectedReciter);
      if (local && local.length > 0) {
        setSelectedReciter({
          ...selectedReciter,
          moshaf: { ...selectedReciter.moshaf, playlist: local },
        });
        return;
      }
    }

    const controller = new AbortController();
    const requestId = ++requestRef.current;
    setDetailError(false);

    // Scope the lookup to this provider when possible; otherwise the route
    // falls back to all enabled sources.
    // Derive the provider from the URL id. A persisted atom may still point at
    // a different reciter/provider, which would query the wrong catalog.
    const source =
      selectedReciter?.id === id
        ? selectedReciter.source
        : id.slice(0, id.lastIndexOf('-'));
    const query = new URLSearchParams({ language: locale });
    if (source) query.set('sources', source);

    fetch(
      `/api/reciters/${encodeURIComponent(id)}/${encodeURIComponent(
        targetMoshafId
      )}?${query.toString()}`,
      { signal: controller.signal }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Reciter | null) => {
        if (requestId !== requestRef.current) return;
        if (data?.moshaf?.playlist?.length) {
          setSelectedReciter(data);
        } else {
          setDetailError(true);
        }
      })
      .catch(() => {
        if (controller.signal.aborted || requestId !== requestRef.current) {
          return;
        }
        setDetailError(true);
      });

    return () => controller.abort();
  }, [
    locale,
    playlistReady,
    retryKey,
    selectedReciter,
    initialReciter,
    setSelectedReciter,
    targetMoshafId,
    id,
  ]);

  if (!mounted) {
    return <PlayerSkeleton />;
  }

  const reciterReady = Boolean(
    activeReciter &&
    activeReciter.id === id &&
    activeReciter.moshaf.id === targetMoshafId &&
    activeReciter.moshaf.playlist.length > 0
  );

  const initialTrackIndex =
    initialSurah && activeReciter
      ? Math.max(
          0,
          activeReciter.moshaf.playlist.findIndex(
            (item) => Number(item.surahId) === initialSurah
          )
        )
      : 0;

  return (
    <div className="flex w-full items-center justify-center p-1 md:p-2">
      <div className="flex w-full flex-col items-center justify-center gap-4">
        {!isFullscreen && <NetworkStatusIndicator />}
        {!isFullscreen && <ReciterSelector />}
        {isFullscreen && (
          <p className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {activeReciter?.name}
          </p>
        )}
        {detailError ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-gray-500">
            <p>
              {formatMessage({
                id: 'reciter.loadError',
                defaultMessage:
                  'Could not load this reciter. Please try again.',
              })}
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="h-11 rounded-[10px] bg-primary px-4 text-[13px] font-bold text-on-primary transition-colors duration-120 hover:bg-primary-hover"
            >
              {formatMessage({ id: 'reciter.retry', defaultMessage: 'Retry' })}
            </button>
          </div>
        ) : reciterReady && activeReciter ? (
          <Suspense fallback={<PlayerSkeleton />}>
            <Player
              key={`${activeReciter.id}:${activeReciter.moshaf.id}:${initialTrackIndex}`}
              playlist={activeReciter.moshaf.playlist}
              initialTrackIndex={initialTrackIndex}
            />
          </Suspense>
        ) : (
          <PlayerSkeleton />
        )}
      </div>
    </div>
  );
}

export default function ReciterPage({
  id,
  moshafId,
  initialReciter,
  initialSurah,
}: {
  id: string;
  moshafId?: string;
  initialReciter?: Reciter;
  initialSurah?: number;
}) {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <div className="flex w-full max-w-lg items-center justify-center p-1 md:p-4">
        <ReciterContent
          id={id}
          moshafId={moshafId}
          initialReciter={initialReciter}
          initialSurah={initialSurah}
        />
      </div>
    </Suspense>
  );
}
