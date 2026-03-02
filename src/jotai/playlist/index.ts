import { atom } from 'jotai';

export type FilterType = 'all' | 'meccan' | 'medinan';

export const playlistSearchAtom = atom('');
export const playlistFilterAtom = atom<FilterType>('all');
export const playlistExpandedAtom = atom(false);
