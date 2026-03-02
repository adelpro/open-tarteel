'use client';
import { useAtomValue } from 'jotai';

import { selectedReciterAtom } from '@/jotai/atoms';
import type { Reciter } from '@/types';

type UseActiveReciterReturn = {
  reciter: Reciter | null;
  moshaf?: Reciter['moshaf'];
  playlist?: Reciter['moshaf']['playlist'];
};

export function useActiveReciter(): UseActiveReciterReturn {
  const selectedReciter = useAtomValue(selectedReciterAtom);

  return {
    reciter: selectedReciter,
    moshaf: selectedReciter?.moshaf,
    playlist: selectedReciter?.moshaf?.playlist,
  };
}
