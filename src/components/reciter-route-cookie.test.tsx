import { render, waitFor } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { selectedReciterAtom } from '@/jotai/atom';

import ReciterRouteCookie from './reciter-route-cookie';

const reciter = {
  id: 'mp3quran.net-1',
  name: 'Ibrahim Al-Akdar',
  source: 'mp3quran.net',
  moshaf: {
    id: '1',
    name: 'Hafs',
    riwaya: 'حفص',
    server: 'https://cdn.example/',
    surah_total: '1',
    playlist: [{ surahId: '1', link: 'https://cdn.example/001.mp3' }],
  },
} as never;

const readCookie = (name: string): string | null => {
  const entry = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null;
};

describe('ReciterRouteCookie', () => {
  beforeEach(() => {
    document.cookie = 'reciter-route=; path=/; max-age=0';
    localStorage.clear();
  });

  it('writes the selected reciter route', async () => {
    const store = createStore();
    store.set(selectedReciterAtom, reciter);

    render(
      <Provider store={store}>
        <ReciterRouteCookie />
      </Provider>
    );

    await waitFor(() =>
      expect(readCookie('reciter-route')).toBe(
        '/reciter/mp3quran.net-1?moshafId=1'
      )
    );
  });

  it('clears the route when no reciter is selected', async () => {
    document.cookie = 'reciter-route=%2Freciter%2Fx%3FmoshafId%3D1; path=/';

    render(
      <Provider store={createStore()}>
        <ReciterRouteCookie />
      </Provider>
    );

    await waitFor(() => expect(readCookie('reciter-route')).toBeNull());
  });
});
