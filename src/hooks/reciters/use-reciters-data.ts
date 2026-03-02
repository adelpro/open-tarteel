'use client';

import { useAtomValue } from 'jotai';

import {
  recitersAtom,
  recitersErrorAtom,
  recitersHydratedAtom,
  recitersLoadingAtom,
  selectedReciterAtom,
} from '@/jotai/atoms';

/**
 * For any nested component that just needs to READ the list.
 * Never triggers a fetch — relies on useReciters() having run upstream.
 */
export function useRecitersData() {
  const hydrated = useAtomValue(recitersHydratedAtom);
  const loading = useAtomValue(recitersLoadingAtom);
  return {
    reciters: useAtomValue(recitersAtom),
    loading: loading || !hydrated,
    error: useAtomValue(recitersErrorAtom),
    selectedReciter: useAtomValue(selectedReciterAtom),
  };
}
