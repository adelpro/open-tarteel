import { act, fireEvent, render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { volumeAtom } from '@/jotai/atom';

import PlayerControls from './player-controls';

vi.mock('next/image', () => ({
  default: ({ src }: { src: string }) =>
    React.createElement('img', { src, alt: '' }),
}));
vi.mock('@/hooks/use-offline-download', () => ({
  useOfflineDownload: () => ({
    progress: null,
    lastError: null,
    downloadAllTracks: vi.fn(),
    cancelDownload: vi.fn(),
    removeAllTracks: vi.fn(),
    isAllCached: () => false,
    getCachedCount: () => 0,
    checkStorageAvailable: vi.fn(),
    estimateStorage: vi.fn(),
  }),
}));
vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => true,
}));

const controlsProps = {
  isPlaying: false,
  volumeRef: { current: null },
  audioRef: { current: null },
  audioElement: null,
  togglePlayPause: vi.fn(),
  handleNextTrack: vi.fn(),
  handlePreviousTrack: vi.fn(),
  togglePlaylistOpen: vi.fn(),
  currentTrackId: 0,
  tahfeezActiveRef: { current: false },
};

const renderControls = () => {
  const store = createStore();
  const view = render(
    <IntlProvider locale="en" messages={{}}>
      <Provider store={store}>
        <PlayerControls {...controlsProps} />
      </Provider>
    </IntlProvider>
  );
  return { store, ...view };
};

describe('PlayerControls', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the transport without waiting for a client effect', () => {
    const html = renderToStaticMarkup(
      <IntlProvider locale="en" messages={{}}>
        <PlayerControls {...controlsProps} />
      </IntlProvider>
    );

    expect(html).toContain('aria-label="Play"');
    expect(html).not.toContain('h-9 w-9');
  });

  it('mutes on a long press and does not open the slider', () => {
    vi.useFakeTimers();
    localStorage.setItem('volume-value', '0.8');
    const { store, getByRole, queryByRole } = renderControls();
    const button = getByRole('button', { name: 'Volume control' });

    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(button);
    fireEvent.click(button);

    expect(store.get(volumeAtom)).toBe(0);
    expect(queryByRole('slider')).toBeNull();
  });

  it('restores the previous level on a second long press', () => {
    vi.useFakeTimers();
    localStorage.setItem('volume-value', '0.8');
    const { store, getByRole } = renderControls();
    const button = getByRole('button', { name: 'Volume control' });

    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(button);

    fireEvent.pointerDown(button);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    fireEvent.pointerUp(button);

    expect(store.get(volumeAtom)).toBeCloseTo(0.8);
  });

  it('keeps a tap for the volume slider', () => {
    const { getByRole } = renderControls();
    const button = getByRole('button', { name: 'Volume control' });

    fireEvent.pointerDown(button);
    fireEvent.pointerUp(button);
    fireEvent.click(button);

    expect(getByRole('slider')).toBeInTheDocument();
  });
});
