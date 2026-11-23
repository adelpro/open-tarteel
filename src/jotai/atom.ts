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

const isVolume = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 1;

export const volumeAtom = createAtomWithStorage<number>('volume-value', 1, {
  validate: isVolume,
});

/** The level a long press restores after unmuting; persisted so it survives a reload. */
export const lastVolumeAtom = createAtomWithStorage<number>(
  'last-volume-value',
  1,
  {
    validate: (value): value is number => isVolume(value) && value > 0,
  }
);

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

/**
 * Show the spectrum. A display preference, so it persists; turning it off
 * leaves the follow-along line alone, and the other way round.
 */
export const spectrumEnabledAtom = createAtomWithStorage<boolean>(
  'spectrum-enabled',
  true
);

/**
 * Show the ahkam marks under the ayah line. Opt-out rather than opt-in: the
 * marks are the reason many people use the line at all.
 */
export const ahkamTagsAtom = createAtomWithStorage<boolean>('ahkam-tags', true);

export type PlayerMode = 'listening' | 'tahfeez';

/**
 * The active playback mode. Shared because the player renders the follow-along
 * line above the spectrum, while the switcher that sets the mode lives in the
 * controls below it.
 */
export const playerModeAtom = atom<PlayerMode>('listening');
/**
 * Sources shown in the reciter list by default: the two word-timing providers,
 * because word timings are what the Quran line needs.
 *
 * Word-timing providers only: Quran Foundation and MP3Quran v4. Other sources
 * stay opt-in so every default supports follow-along.
 */
export const enabledSourcesAtom = createAtomWithStorage<LinkSource[]>(
  'enabled-sources',
  [LinkSource.QURAN_FOUNDATION, LinkSource.MP3QURAN_V4]
);

/** Desktop reciter panel state. It must survive a route change. */
export const reciterListOpenAtom = atom(false);
// A pinned panel is a preference: remember it across reloads and sessions.
export const reciterListPinnedAtom = createAtomWithStorage<boolean>(
  'reciters-list-pinned',
  false
);

/**
 * Show the word-synced line in the follow-along mode.
 *
 * Persisted: it is a reading preference, not view state, so it must survive a
 * reload. Off means the mode is not offered at all, which leaves the spectrum
 * as the only thing on screen.
 */
export const followAlongLineAtom = createAtomWithStorage<boolean>(
  'follow-along-line',
  true,
  { getOnInit: true }
);

/** Set while the follow-along mode is open, so the spectrum can stand aside. */
export const followAlongActiveAtom = atom(false);
