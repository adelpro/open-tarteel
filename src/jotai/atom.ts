import { atom } from 'jotai';

import { Reciter } from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  'favorite-reciter',
  []
);

export const selectedReciterAtom = atom<Reciter | undefined>();
selectedReciterAtom.debugLabel = 'selected-reciter';
