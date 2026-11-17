import { atom, type SetStateAction } from 'jotai';

import { LinkSource, Reciter, Riwaya } from '@/types';
import { markSettingsChanged } from '@/utils/settings-sync';
import { APP_STORAGE_KEYS } from '@/utils/storage/storage-keys';

import { createAtomWithStorage } from './create-atom-with-storage';

/**
 * A setting the account ring carries between devices.
 *
 * Returns two atoms over one storage key. The first keeps the old export name,
 * so every component reads and writes it unchanged; its setter also stamps the
 * change and tells the account sync to push it. The second (`*StoredAtom`) is
 * the raw storage atom: the sync writes values that arrived from the ring there,
 * so adopting a value never stamps it and never sends it back.
 */
function syncedSetting<T>(key: string, initialValue: T) {
  const stored = createAtomWithStorage<T>(key, initialValue);
  const local = atom(
    (get) => get(stored),
    (_get, set, update: SetStateAction<T>) => {
      set(stored, update);
      markSettingsChanged();
    }
  );
  return [local, stored] as const;
}

export const favoriteRecitersAtom = createAtomWithStorage<string[]>(
  APP_STORAGE_KEYS.favorites,
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

export const [playbackSpeedAtom, playbackSpeedStoredAtom] =
  syncedSetting<number>('playback-speed-value', 1);

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

export const [recitersSortAtom, recitersSortStoredAtom] = syncedSetting<
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
export const [themeAtom, themeStoredAtom] = syncedSetting<Theme>(
  'theme-preference',
  'system'
);

/** The colour palette is a separate axis from the light/dark mode. */
export type Palette = 'classic' | 'warm' | 'night';
export const [paletteAtom, paletteStoredAtom] = syncedSetting<Palette>(
  'theme-palette',
  'warm'
);

export type VisualiserModel = 'bars' | 'peaks' | 'ribbon';
export const [visualizerModelAtom, visualizerModelStoredAtom] =
  syncedSetting<VisualiserModel>('visualizer-model', 'ribbon');
export const [enabledSourcesAtom, enabledSourcesStoredAtom] = syncedSetting<
  LinkSource[]
>('enabled-sources', [LinkSource.MP3QURAN, LinkSource.ITQAN]);

/** Desktop reciter panel state. It must survive a route change. */
export const reciterListOpenAtom = atom(false);
// A pinned panel is a preference: remember it across reloads and sessions.
export const reciterListPinnedAtom = createAtomWithStorage<boolean>(
  'reciters-list-pinned',
  false
);
