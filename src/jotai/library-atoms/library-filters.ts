import { atom } from 'jotai';

import { LIBRARY_TABS } from '@/constants';
import { LibraryTab } from '@/types/tracks/tab-type';

export const libraryTabAtom = atom<LibraryTab>(LIBRARY_TABS.ALL);
export const librarySearchQueryAtom = atom<string>('');
