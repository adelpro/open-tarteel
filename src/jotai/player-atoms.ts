import { atom } from 'jotai';

import { Track } from '@/types';

export const isPlayingAtom = atom<boolean>(false);
export const durationAtom = atom<number>(0);
export const currentTimeAtom = atom<number>(0);

export const currentTrackAtom = atom<number>(0);
export const shuffledIndicesAtom = atom<number[]>([]);
export const playlistDialogAtom = atom(false);

export const playerTrackAtom = atom<Track | null>(null);
