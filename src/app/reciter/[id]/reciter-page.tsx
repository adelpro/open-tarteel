'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';
import { LinkSource, Reciter } from '@/types';

const Player = dynamic(() => import('@/components/player'), { ssr: false });

function ReciterContent() {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
  const { formatMessage, locale } = useIntl();
  const [mounted, setMounted] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const attemptedKey = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFullscreen]);

  const currentKey = selectedReciter
    ? `${selectedReciter.id}:${selectedReciter.moshaf.id}`
    : null;

  // Itqan omits the 114-track playlist from the catalog. Fetch it on selection,
  // and also refetch stale persisted entries that only hold one page of tracks.
  const needsPlaylist = Boolean(
    selectedReciter &&
    currentKey !== attemptedKey.current &&
    (selectedReciter.moshaf.playlist.length === 0 ||
      (selectedReciter.source === LinkSource.ITQAN &&
        selectedReciter.moshaf.playlist.length <
          Number(selectedReciter.moshaf.surah_total)))
  );

  useEffect(() => {
    if (!selectedReciter || !currentKey || !needsPlaylist) return;

    attemptedKey.current = currentKey;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(false);

    // Scope the catalog lookup to this provider so the detail route does not
    // re-fetch every adapter just to find one reciter.
    const params = new URLSearchParams({
      language: locale,
      sources: selectedReciter.source,
    });
    fetch(
      `/api/reciters/${encodeURIComponent(selectedReciter.id)}/${encodeURIComponent(
        selectedReciter.moshaf.id
      )}?${params.toString()}`
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Reciter | null) => {
        if (cancelled) return;
        if (data?.moshaf?.playlist?.length) {
          setSelectedReciter(data);
        } else {
          setDetailError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setDetailError(true);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    currentKey,
    locale,
    needsPlaylist,
    retryKey,
    selectedReciter,
    setSelectedReciter,
  ]);

  if (!mounted || !selectedReciter) {
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
          onClick={() => {
            attemptedKey.current = null;
            setRetryKey((key) => key + 1);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {formatMessage({ id: 'reciter.retry', defaultMessage: 'Retry' })}
        </button>
      </div>
    );
  }

  if (detailLoading || selectedReciter.moshaf.playlist.length === 0) {
    return <SimpleSkeleton />;
  }

  return (
    <div className="flex w-full items-center justify-center p-1 md:p-2">
      <div className="flex w-full flex-col items-center justify-center gap-4">
        {!isFullscreen && <ReciterSelector />}
        {isFullscreen && (
          <p className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {selectedReciter?.name}
          </p>
        )}
        {selectedReciter?.moshaf && (
          <Suspense fallback={<SimpleSkeleton />}>
            <Player playlist={selectedReciter.moshaf.playlist} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default function ReciterPage() {
  return (
    <Suspense fallback={<SimpleSkeleton />}>
      <div className="flex w-full max-w-lg items-center justify-center p-1 md:p-4">
        <ReciterContent />
      </div>
    </Suspense>
  );
}
