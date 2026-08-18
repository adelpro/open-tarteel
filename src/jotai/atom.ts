import { LinkSource, Reciter, Riwaya } from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';
import { Language } from '@/constants/language';

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

//add de as a locale option

export const localeAtom = createAtomWithStorage<Language>('locale', 'ar');

export const currentTimeAtom = createAtomWithStorage<number>('current-time', 0);

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
export const selectedReciterAtom = createAtomWithStorage<Reciter | null>(
  'selected-reciter',
  null
);

export type Theme = 'light' | 'dark' | 'system';
export const themeAtom = createAtomWithStorage<Theme>(
  'theme-preference',
  'system'
);
export const enabledSourcesAtom = createAtomWithStorage<LinkSource[]>(
  'enabled-sources',
  [LinkSource.MP3QURAN, LinkSource.ITQAN]
);
