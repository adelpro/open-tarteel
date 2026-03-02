import { LinkSource } from '@/constants';
import { PlaybackMode, PlaybackSpeed } from '@/types';
import { AppTheme } from '@/types/settings';

import { createAtomWithStorage } from '../create-atom-with-storage';

export const settingsEnabledSourcesAtom = createAtomWithStorage<LinkSource[]>(
  'settings-enabled-sources',
  [LinkSource.MP3QURAN, LinkSource.ITQAN]
);

export const settingsPlaybackModeAtom = createAtomWithStorage<PlaybackMode>(
  'settings-playback-mode',
  'off'
);
export const settingsPlaybackSpeedAtom = createAtomWithStorage<PlaybackSpeed>(
  'settings-playback-speed-value',
  1
);

export const settingsThemeAtom = createAtomWithStorage<AppTheme>(
  'settings-theme',
  'system'
);
