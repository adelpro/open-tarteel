import { atom } from 'jotai';

import { Reciter, Riwaya } from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  'favorite-reciter',
  []
);
export const selectedRiwayaAtom = createAtomWithStorage<Riwaya | 'all'>(
  'selected-riwaya',
  'all'
);
export const recitersSortAtom = createAtomWithStorage<
  'popular' | 'alphabetical' | 'views'
>('reciters-sort-atom', 'popular');
export const selectedReciterAtom = createAtomWithStorage<Reciter | null>(
  'selected-riwaya',
  null
);
