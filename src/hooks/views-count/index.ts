'use client';

import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { fetchViewCounts, subscribeToViewCounts } from '@/gun/view-rank';

const viewCountsAtom = atom<Record<string, number>>({});

export function useViewCounts() {
  return useAtomValue(viewCountsAtom);
}

export function useSyncViewCounts() {
  const setViewCounts = useSetAtom(viewCountsAtom);

  useEffect(() => {
    let mounted = true;

    fetchViewCounts().then((data) => {
      if (mounted) setViewCounts(data);
    });

    const unsubscribe = subscribeToViewCounts(setViewCounts);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setViewCounts]);
}
