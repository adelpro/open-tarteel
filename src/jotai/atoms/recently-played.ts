import { atom } from 'jotai';

import { createAtomWithStorage } from '../create-atom-with-storage';

const RECENTLY_PLAYED_KEY = 'recently-played-reciters';
export const recentlyPlayedAtom = createAtomWithStorage<string[]>(
  RECENTLY_PLAYED_KEY,
  []
);

export const showRecentOnlyAtom = atom<boolean>(false);
