'use client';

import { useSetAtom } from 'jotai';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { useReciters } from '@/hooks/use-reciters';
import { selectedReciterAtom } from '@/jotai/atom';

export function useReciterFromUrl() {
  const searchParams = useSearchParams();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const { reciters } = useReciters();

  useEffect(() => {
    if (!searchParams || reciters.length === 0) return;

    // Get the reciter ID from the URL path (not from search params)
    // The URL pattern is /reciter/[id], so we need to get the ID from the path
    // We can use window.location.pathname to get the current path
    const pathParts = window.location.pathname.split('/');
    const reciterIdFromPath = pathParts.at(-1);

    // Get the moshafId from search params
    const moshafId = searchParams.get('moshafId');

    if (!reciterIdFromPath && !moshafId) return;

    // If we have a reciter ID from the URL path, find it in our reciters list
    if (reciterIdFromPath) {
      const reciter = reciters.find((r) => r.id === Number(reciterIdFromPath));
      if (reciter) {
        // If we also have a moshafId, make sure the reciter has that moshaf
        if (moshafId && reciter.moshaf.id !== moshafId) {
          // Try to find a matching moshaf for this reciter
          const matchingReciter = reciters.find(
            (r) =>
              r.id === Number(reciterIdFromPath) && r.moshaf.id === moshafId
          );
          if (matchingReciter) {
            setSelectedReciter(matchingReciter);
          } else {
            setSelectedReciter(reciter); // Fall back to the reciter without matching moshaf
          }
        } else {
          setSelectedReciter(reciter);
        }
      }
      return;
    }

    // If we only have a moshafId, find a reciter with that moshaf
    if (moshafId) {
      const reciter = reciters.find((r) => r.moshaf.id === moshafId);
      if (reciter) {
        setSelectedReciter(reciter);
      }
    }
  }, [searchParams, reciters, setSelectedReciter]);
}
