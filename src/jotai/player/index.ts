import { atom } from 'jotai';

import type { PlayerTrack } from '@/types';

// ── Core playback state ───────────────────────────────────────────────────────
export const isPlayingAtom = atom<boolean>(false);
export const durationAtom = atom<number>(0);
export const currentTimeAtom = atom<number>(0);
export const playbackModeAtom = atom<'normal' | 'repeat-one' | 'shuffle'>(
  'normal'
);
export const playbackSpeedAtom = atom<number>(1);
export const volumeAtom = atom<number>(1);
export const playlistDialogAtom = atom<boolean>(false);

// ── Playlist state ────────────────────────────────────────────────────────────
// The player's current queue. Set externally — player doesn't care about the source.
export const playerPlaylistAtom = atom<PlayerTrack[]>([]);
export const playerTrackIndexAtom = atom<number>(0); // index into playerPlaylistAtom
export const shuffledIndicesAtom = atom<number[]>([]);

// ── Derived: active track ─────────────────────────────────────────────────────
// Read-only derived atom — always in sync with playlist + index.
export const activeTrackAtom = atom<PlayerTrack | null>((get) => {
  const playlist = get(playerPlaylistAtom);
  const index = get(playerTrackIndexAtom);
  return playlist[index] ?? null;
});

// ── Write atom: exit player ───────────────────────────────────────────────────
// Clears playlist + resets index + stops playback in one atomic write.
// Player's isReady = Boolean(track && audioSource) becomes false → returns null.
export const exitPlayerAtom = atom(null, (_get, set) => {
  set(playerPlaylistAtom, []);
  set(playerTrackIndexAtom, 0);
  set(isPlayingAtom, false);
});

// ── Source label (for TrackInfo display) ─────────────────────────────────────
export type PlayerSource = 'reciter' | 'library';
export const playerSourceAtom = atom<PlayerSource>('reciter');
