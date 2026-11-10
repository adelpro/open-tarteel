import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
