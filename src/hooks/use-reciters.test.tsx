import { renderHook, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { selectedReciterAtom } from '@/jotai/atom';
import { getAllReciters } from '@/utils/api';

import { useReciters } from './use-reciters';

vi.mock('@/utils/api', () => ({ getAllReciters: vi.fn() }));

const stored = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.example/',
    surah_total: '1',
    surahIds: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
} as never;

const catalogEntry = (moshafId: string, playlist: unknown[] = []) => ({
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: moshafId,
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.example/',
    surah_total: '1',
    surahIds: '1',
    playlist,
  },
});

const run = (store: ReturnType<typeof createStore>) =>
  renderHook(() => useReciters(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <IntlProvider locale="en" messages={{}}>
        <Provider store={store}>{children}</Provider>
      </IntlProvider>
    ),
  });

describe('useReciters with a stored reciter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not replace the stored moshaf with another one from the catalog', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([catalogEntry('9')] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() => expect(getAllReciters).toHaveBeenCalled());
    expect(store.get(selectedReciterAtom)?.moshaf.id).toBe('1');
  });

  it('keeps the stored playlist when the catalog entry has none', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([catalogEntry('1')] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() =>
      expect(store.get(selectedReciterAtom)?.moshaf.playlist).toHaveLength(1)
    );
  });

  it('clears the selection when the reciter disappears from the catalog', async () => {
    vi.mocked(getAllReciters).mockResolvedValue([] as never);
    const store = createStore();
    store.set(selectedReciterAtom, stored);
    run(store);

    await waitFor(() => expect(store.get(selectedReciterAtom)).toBeNull());
  });
});
