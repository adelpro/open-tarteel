'use client';

import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import ReciterSelector from '@/components/reciter-selector';
import SimpleSkeleton from '@/components/simple-skeleton';
import { fullscreenAtom, selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';

const Player = dynamic(() => import('@/components/player'), { ssr: false });

function ReciterContent({ id, moshafId }: { id: string; moshafId?: string }) {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const [isFullscreen, setFullscreen] = useAtom(fullscreenAtom);
  const { formatMessage, locale } = useIntl();
  const [mounted, setMounted] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef(0);

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

  // Fall back to the selected atom when a link omits `moshafId`.
  const targetMoshafId =
    moshafId ??
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
    if (playlistReady) return;

    const controller = new AbortController();
    const requestId = ++requestRef.current;
    setDetailError(false);

    // Scope the lookup to this provider when possible; otherwise the route
    // falls back to all enabled sources.
    const source = selectedReciter?.source ?? id.slice(0, id.lastIndexOf('-'));
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
    selectedReciter?.source,
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
        {!isFullscreen && <ReciterSelector />}
        {isFullscreen && (
          <p className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
            {selectedReciter.name}
          </p>
        )}
        <Suspense fallback={<SimpleSkeleton />}>
          <Player playlist={selectedReciter.moshaf.playlist} />
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
