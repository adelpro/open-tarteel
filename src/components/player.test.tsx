import { act, fireEvent, render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaybackMode, playbackModeAtom } from '@/jotai/atom';

import Player from './player';

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}));
vi.mock('@/hooks/use-media-session', () => ({
  useMediaSession: vi.fn(),
}));
vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => true,
}));
vi.mock('@/hooks/use-offline-download', () => ({
  useOfflineDownload: () => ({ isTrackCached: () => true }),
}));
vi.mock('./player-controls', () => ({ default: () => null }));
vi.mock('./range', () => ({ default: () => null }));
vi.mock('./track-info', () => ({ default: () => null }));

const playlist = [1, 2, 3].map((surah) => ({
  surahId: String(surah),
  link: `https://cdn.mp3quran.net/audio/reciter/00${surah}.mp3`,
}));

const renderPlayer = (mode: PlaybackMode = 'off') => {
  const store = createStore();
  const view = render(
    <IntlProvider locale="en" messages={{}}>
      <Provider store={store}>
        <Player playlist={playlist} />
      </Provider>
    </IntlProvider>
  );
  act(() => {
    store.set(playbackModeAtom, mode);
  });
  const audio = view.container.querySelector(
    'audio'
  ) as HTMLAudioElement | null;
  if (!audio) throw new Error('audio element did not render');

  return { store, audio, ...view };
};

describe('Player auto-advance at the end of a track', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    playSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restarts the same surah in repeat-one after the browser pauses at the end', () => {
    const { audio } = renderPlayer('repeat-one');
    const source = audio.getAttribute('src');

    // Browsers fire `pause` before `ended` when playback reaches the end, so
    // React state already says "not playing" by the time `ended` arrives.
    fireEvent.play(audio);
    fireEvent.pause(audio);
    playSpy.mockClear();

    fireEvent.ended(audio);

    expect(playSpy).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(audio.getAttribute('src')).toBe(source);
  });

  it('advances to the next surah and keeps playing in normal mode', () => {
    const { audio } = renderPlayer('off');

    fireEvent.play(audio);
    fireEvent.pause(audio);
    playSpy.mockClear();

    fireEvent.ended(audio);

    expect(audio.getAttribute('src')).toBe(playlist[1].link);
    expect(playSpy).toHaveBeenCalled();
  });
});
