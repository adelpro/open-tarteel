'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import LocalizedLink from '@/components/localized-link';
import NetworkStatusIndicator from '@/components/network-status-indicator';
import ReciterSelector from '@/components/reciter-selector';
import { useReciters } from '@/hooks/use-reciters';
import { selectedReciterAtom } from '@/jotai/atom';

/**
 * The interactive part of the home page. The server page above it carries the
 * H1, the description and the crawlable reciter links; this component only
 * adds the selector and the "continue listening" shortcut.
 */
export default function HomeClient() {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const { reciters, loading } = useReciters();
  const { formatMessage } = useIntl();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || reciters.length === 0) return;
    if (
      selectedReciter &&
      !reciters.some(
        (reciter) =>
          reciter.id === selectedReciter.id &&
          reciter.moshaf.id === selectedReciter.moshaf.id
      )
    ) {
      setSelectedReciter(null);
    }
  }, [loading, reciters, selectedReciter, setSelectedReciter]);

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
      {selectedReciter ? (
        <LocalizedLink
          href={`/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`}
          className="text-[13px] font-bold text-primary hover:text-primary-hover"
        >
          {formatMessage({ id: 'home.continueListening' })} —{' '}
          {selectedReciter.name}
        </LocalizedLink>
      ) : null}
    </div>
  );
}
