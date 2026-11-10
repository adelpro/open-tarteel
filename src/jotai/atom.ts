import { atom } from 'jotai';

import { LinkSource, Reciter, Riwaya } from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  'favorite-reciter',
  []
);
export const selectedRiwayaAtom = createAtomWithStorage<Riwaya | 'all'>(
  'selected-riwaya',
  'all'
);
export const fullscreenAtom = createAtomWithStorage<boolean>(
  'fullscreen',
  false
);
export const showVisualizerAtom = createAtomWithStorage<boolean>(
  'show-visualizer',
  true
);
export const forcedOfflineAtom = createAtomWithStorage<boolean>(
  'forced-offline',
  false
);

// Playback position is per session: a reload starts from the beginning and
// the audio element writes time on every `timeupdate`, so persisting it would
// add a synchronous localStorage write four times a second.
export const currentTimeAtom = atom(0);

export const playbackSpeedAtom = createAtomWithStorage<number>(
  'playback-speed-value',
  1
);

export type PlaybackMode = 'off' | 'shuffle' | 'repeat-one';
export const playbackModeAtom = createAtomWithStorage<PlaybackMode>(
  'playback-mode',
  'off'
);

export const volumeAtom = createAtomWithStorage<number>('volume-value', 1);

export const recitersSortAtom = createAtomWithStorage<
  'popular' | 'alphabetical' | 'views'
>('reciters-sort-atom', 'alphabetical');

/** Reject a persisted reciter that predates the current shape. */
const isSelectedReciter = (value: unknown): value is Reciter | null => {
  if (value === null) return true;
  if (typeof value !== 'object') return false;

  const reciter = value as Partial<Reciter>;
  const moshaf = reciter.moshaf;

  return (
    typeof reciter.id === 'string' &&
    typeof reciter.name === 'string' &&
    typeof reciter.source === 'string' &&
    typeof moshaf === 'object' &&
    moshaf !== null &&
    typeof moshaf.id === 'string' &&
    typeof moshaf.name === 'string' &&
    Array.isArray(moshaf.playlist)
  );
};

export const selectedReciterAtom = createAtomWithStorage<Reciter | null>(
  'selected-reciter',
  null,
  { getOnInit: true, validate: isSelectedReciter }
);

export type Theme = 'light' | 'dark' | 'system';
export const themeAtom = createAtomWithStorage<Theme>(
  'theme-preference',
  'system'
);

/** The colour palette is a separate axis from the light/dark mode. */
export type Palette = 'classic' | 'warm' | 'night';
export const paletteAtom = createAtomWithStorage<Palette>(
  'theme-palette',
  'warm'
);

export type VisualiserModel = 'bars' | 'peaks' | 'ribbon';
export const visualizerModelAtom = createAtomWithStorage<VisualiserModel>(
  'visualizer-model',
  'ribbon'
);
export const enabledSourcesAtom = createAtomWithStorage<LinkSource[]>(
  'enabled-sources',
  [LinkSource.MP3QURAN, LinkSource.ITQAN]
);

/** Desktop reciter panel state. It must survive a route change. */
export const reciterListOpenAtom = atom(false);
// A pinned panel is a preference: remember it across reloads and sessions.
export const reciterListPinnedAtom = createAtomWithStorage<boolean>(
  'reciters-list-pinned',
  false
);
