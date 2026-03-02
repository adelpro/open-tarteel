import { atom } from 'jotai';

import { createAtomWithStorage } from '../create-atom-with-storage';

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  'favorite-reciters',
  []
);
export const favoriteCountsAtom = createAtomWithStorage<Record<string, number>>(
  'favorite-counts',
  {}
);
export const showFavoriteRecitersOnlyAtom = atom<boolean>(true);
