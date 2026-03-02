import { Riwaya } from '@/constants';
import {
  DownloadTask,
  PlaybackMode,
  PlaybackSpeed,
  RecitersSortType,
  SORT_TYPE,
} from '@/types';

import { createAtomWithStorage } from './create-atom-with-storage';
export * from './library-atoms';
export * from './playlist';

export const selectedRiwayaAtom = createAtomWithStorage<Riwaya | null>(
  'selected-riwaya',
  null
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

export const currentTimeAtom = createAtomWithStorage<number>('current-time', 0);

export const playbackSpeedAtom = createAtomWithStorage<PlaybackSpeed>(
  'playback-speed-value',
  1
);

export const playbackModeAtom = createAtomWithStorage<PlaybackMode>(
  'playback-mode',
  'off'
);

export const downloadQueueAtom = createAtomWithStorage<DownloadTask[]>(
  'download-queue',
  []
);
export const activeDownloadAtom = createAtomWithStorage<string | null>(
  'active-download',
  null
);

export const volumeAtom = createAtomWithStorage<number>('volume-value', 1);

export const recitersSortAtom = createAtomWithStorage<RecitersSortType>(
  'reciters-sort-atom',
  SORT_TYPE.ALPHABETICAL
);
