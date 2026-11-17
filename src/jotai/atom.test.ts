import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SETTINGS_EVENT, STORAGE_KEYS } from '@/utils/storage/storage-keys';

const storedReciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
    surah_total: '1',
    surahIds: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
};

describe('selectedReciterAtom', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('reads the stored reciter on the first read', async () => {
    localStorage.setItem('selected-reciter', JSON.stringify(storedReciter));
    const { selectedReciterAtom } = await import('./atom');

    expect(createStore().get(selectedReciterAtom)).toEqual(storedReciter);
  });

  it('falls back to null for corrupt storage', async () => {
    localStorage.setItem('selected-reciter', '{oops');
    const { selectedReciterAtom } = await import('./atom');

    expect(createStore().get(selectedReciterAtom)).toBeNull();
  });

  it('drops a stored value that is missing required fields', async () => {
    localStorage.setItem(
      'selected-reciter',
      JSON.stringify({ id: 'mp3quran.net-1', name: 'Broken' })
    );
    const { selectedReciterAtom } = await import('./atom');

    expect(createStore().get(selectedReciterAtom)).toBeNull();
  });
});

describe('currentTimeAtom', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('starts at zero even when a stored position exists', async () => {
    localStorage.setItem('current-time', '42');
    const { currentTimeAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(currentTimeAtom, () => {});

    expect(store.get(currentTimeAtom)).toBe(0);
    unsubscribe();
  });

  it('does not write the position back to storage', async () => {
    localStorage.setItem('current-time', '42');
    const { currentTimeAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(currentTimeAtom, () => {});

    store.set(currentTimeAtom, 12);

    expect(localStorage.getItem('current-time')).toBe('42');
    unsubscribe();
  });
});

describe('reciterListPinnedAtom', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('hydrates the pinned preference from storage', async () => {
    localStorage.setItem('reciters-list-pinned', 'true');
    const { reciterListPinnedAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(reciterListPinnedAtom, () => {});

    expect(store.get(reciterListPinnedAtom)).toBe(true);
    unsubscribe();
  });

  it('writes the preference when toggled', async () => {
    const { reciterListPinnedAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(reciterListPinnedAtom, () => {});

    store.set(reciterListPinnedAtom, true);

    expect(localStorage.getItem('reciters-list-pinned')).toBe('true');
    unsubscribe();
  });
});

describe('synced settings atoms', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('stamps a change made on this device and tells the account sync', async () => {
    const { themeAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(themeAtom, () => {});
    const heard = vi.fn();
    window.addEventListener(SETTINGS_EVENT, heard);

    store.set(themeAtom, 'dark');

    expect(store.get(themeAtom)).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('"dark"');
    expect(
      Number(localStorage.getItem(STORAGE_KEYS.settingsUpdatedAt))
    ).toBeGreaterThan(0);
    expect(heard).toHaveBeenCalledTimes(1);

    window.removeEventListener(SETTINGS_EVENT, heard);
    unsubscribe();
  });

  it('adopts a value from the ring without stamping or echoing it', async () => {
    const { themeAtom, themeStoredAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(themeAtom, () => {});
    const heard = vi.fn();
    window.addEventListener(SETTINGS_EVENT, heard);

    store.set(themeStoredAtom, 'light');

    // Same storage key, so the component atom reads the adopted value.
    expect(store.get(themeAtom)).toBe('light');
    expect(localStorage.getItem(STORAGE_KEYS.settingsUpdatedAt)).toBeNull();
    expect(heard).not.toHaveBeenCalled();

    window.removeEventListener(SETTINGS_EVENT, heard);
    unsubscribe();
  });

  it('keeps functional updates working through the wrapper', async () => {
    const { playbackSpeedAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = store.sub(playbackSpeedAtom, () => {});

    store.set(playbackSpeedAtom, (previous) => (previous === 1 ? 1.5 : 1));

    expect(store.get(playbackSpeedAtom)).toBe(1.5);
    unsubscribe();
  });

  it('leaves device-local settings unstamped', async () => {
    const { volumeAtom, playbackModeAtom } = await import('./atom');
    const store = createStore();
    const unsubscribe = [
      store.sub(volumeAtom, () => {}),
      store.sub(playbackModeAtom, () => {}),
    ];

    store.set(volumeAtom, 0.5);
    store.set(playbackModeAtom, 'shuffle');

    expect(localStorage.getItem(STORAGE_KEYS.settingsUpdatedAt)).toBeNull();
    for (const stop of unsubscribe) stop();
  });
});
