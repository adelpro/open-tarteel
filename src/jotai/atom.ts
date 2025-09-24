import { Reciter, Riwaya } from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  'favorite-reciter',
  []
);
export const selectedRiwayaAtom = createAtomWithStorage<Riwaya | 'all'>(
  'selected-riwaya',
  'all'
);
export const hideUnderConstructionAtom = createAtomWithStorage<boolean>(
  'hide-under-construction',
  false
);
export const fullscreenAtom = createAtomWithStorage<boolean>(
  'fullscreen',
  false
);
export const showVisualizerAtom = createAtomWithStorage<boolean>(
  'show-visualizer',
  true
);

export const localeAtom = createAtomWithStorage<'ar' | 'en'>('locale', 'ar');

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
