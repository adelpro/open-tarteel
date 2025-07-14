import { atom } from 'jotai';

import { Reciter } from '@/types';

export const selectedReciterAtom = atom<Reciter | undefined>();
selectedReciterAtom.debugLabel = 'selected-reciter';

export const webtorrentReadyAtom = atom<boolean>(false);
webtorrentReadyAtom.debugLabel = 'webtorrent-ready';
