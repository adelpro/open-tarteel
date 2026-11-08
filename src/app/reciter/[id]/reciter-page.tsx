'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import NetworkStatusIndicator from '@/components/network-status-indicator';
import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';
import type { Playlist, Reciter } from '@/types';
import { LinkSource } from '@/types';

/** Build MP3Quran/Qurani.ai playlists from the compact catalog hints. */
const buildLocalPlaylist = (reciter: Reciter): Playlist | null => {
  const { moshaf } = reciter;

  if (
    reciter.source === LinkSource.MP3QURAN &&
    moshaf.server &&
    moshaf.surahIds
  ) {
    return moshaf.surahIds
      .split(',')
      .filter(Boolean)
      .map((surahId) => ({
        surahId,
        link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
      }));
  }

  if (reciter.source === LinkSource.QURANAI && moshaf.server) {
    const total = Number(moshaf.surah_total) || 114;
    return Array.from({ length: total }, (_, index) => {
      const surahNumber = index + 1;
      return {
        surahId: String(surahNumber),
        link: `${moshaf.server}${surahNumber}.mp3`,
      };
    });
  }

  return null;
};

const Player = dynamic(() => import('@/components/player'), { ssr: false });

function ReciterContent({ id, moshafId }: { id: string; moshafId?: string }) {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
  const { formatMessage, locale } = useIntl();
  const [mounted, setMounted] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [queryMoshafId, setQueryMoshafId] = useState<string>();
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef(0);
  const timingRefreshRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setQueryMoshafId(
      new URLSearchParams(window.location.search).get('moshafId') ?? undefined
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFullscreen]);

  // Fall back to the selected atom when a link omits `moshafId`.
  const targetMoshafId =
    moshafId ??
    queryMoshafId ??
    (id && selectedReciter?.id === id ? selectedReciter.moshaf.id : undefined);

  const playlistReady = Boolean(
    id &&
    targetMoshafId &&
    selectedReciter?.id === id &&
    selectedReciter.moshaf.id === targetMoshafId &&
    selectedReciter.moshaf.playlist.length > 0
  );

  useEffect(() => {
    if (!id || !targetMoshafId) return;

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
    setSelectedReciter,
    targetMoshafId,
    id,
  ]);

  if (!mounted) {
    return <SimpleSkeleton />;
  }

  if (detailError) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-gray-500">
        <p>
          {formatMessage({
            id: 'reciter.loadError',
            defaultMessage: 'Could not load this reciter. Please try again.',
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
    );
  }

  if (
    !selectedReciter ||
    selectedReciter.id !== id ||
    selectedReciter.moshaf.id !== targetMoshafId ||
    selectedReciter.moshaf.playlist.length === 0
  ) {
    return <SimpleSkeleton />;
  }

  return (
    <div className="flex w-full items-center justify-center p-1 md:p-2">
      <div className="flex w-full flex-col items-center justify-center gap-4">
        {!isFullscreen && <NetworkStatusIndicator />}
        {!isFullscreen && <ReciterSelector />}
        {isFullscreen && (
          <p className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {selectedReciter.name}
          </p>
        )}
        <Suspense fallback={<SimpleSkeleton />}>
          <Player
            key={`${selectedReciter.id}:${selectedReciter.moshaf.id}`}
            playlist={selectedReciter.moshaf.playlist}
          />
        </Suspense>
      </div>
    </div>
  );
}

export default function ReciterPage({
  id,
  moshafId,
}: {
  id: string;
  moshafId?: string;
}) {
  return (
    <Suspense fallback={<SimpleSkeleton />}>
      <div className="flex w-full max-w-lg items-center justify-center p-1 md:p-4">
        <ReciterContent id={id} moshafId={moshafId} />
      </div>
    </Suspense>
  );
}
