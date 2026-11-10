'use client';

import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import NetworkStatusIndicator from '@/components/network-status-indicator';
import ReciterSelector from '@/components/reciter-selector';
import { useReciters } from '@/hooks/use-reciters';
import { selectedReciterAtom } from '@/jotai/atom';
import { reciterRouteFor } from '@/lib/reciter-route';

/**
 * The interactive part of the home page: the selector and the player.
 */
export default function HomeClient() {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const { reciters, loading } = useReciters();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Returning listeners resume their player. The middleware already covers
  // loads that carry the route cookie; this handles the first visit after an
  // upgrade (localStorage only) and client-side navigation back home.
  useEffect(() => {
    if (!mounted || !selectedReciter || redirectedRef.current) return;

    if (
      !loading &&
      reciters.length > 0 &&
      !reciters.some(
        (reciter) =>
          reciter.id === selectedReciter.id &&
          reciter.moshaf.id === selectedReciter.moshaf.id
      )
    ) {
      setSelectedReciter(null);
      return;
    }

    redirectedRef.current = true;
    router.replace(reciterRouteFor(selectedReciter));
  }, [mounted, selectedReciter, loading, reciters, setSelectedReciter, router]);

  if (!mounted) {
    return (
      <div className="flex w-full justify-center">
        <div className="flex min-h-16 w-full max-w-lg items-center rounded-2xl border border-border bg-surface p-1.5">
          <span className="h-4 w-40 animate-pulse rounded-full bg-surface-sunken" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <div className="w-full max-w-lg">
        <NetworkStatusIndicator />
      </div>
      <ReciterSelector />
    </div>
  );
}
