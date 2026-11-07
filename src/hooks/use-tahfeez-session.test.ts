import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useTahfeezSession } from './use-tahfeez-session';

const createAudio = () => {
  const listeners = new Map<string, Set<() => void>>();
  const audio = {
    currentTime: 0,
    paused: true,
    play: vi.fn(() => {
      audio.paused = false;
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      audio.paused = true;
    }),
    addEventListener: (event: string, handler: () => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)?.add(handler);
    },
    removeEventListener: (event: string, handler: () => void) => {
      listeners.get(event)?.delete(handler);
    },
    emit: (event: string) => {
      for (const handler of listeners.get(event) ?? []) handler();
    },
  };
  return audio as unknown as HTMLAudioElement & typeof audio;
};

describe('useTahfeezSession', () => {
  let frames: Array<(time: number) => void>;

  beforeEach(() => {
    vi.useFakeTimers();
    frames = [];
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: (time: number) => void) => {
        frames.push(callback);
        return frames.length;
      }
    );
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const runFrame = () => {
    const pending = frames;
    frames = [];
    for (const callback of pending) callback(0);
  };

  it('starts on the first range and advances at the exact boundary', () => {
    const audio = createAudio();
    const onActiveChange = vi.fn();
    const { result } = renderHook(() =>
      useTahfeezSession(audio, onActiveChange)
    );

    act(() => {
      result.current.start(
        [
          { startTime: 1, endTime: 2 },
          { startTime: 5, endTime: 6 },
        ],
        1,
        0
      );
    });

    expect(audio.currentTime).toBe(1);
    expect(audio.play).toHaveBeenCalled();
    expect(onActiveChange).toHaveBeenCalledWith(true);

    audio.currentTime = 2;
    act(() => runFrame());
    expect(audio.currentTime).toBe(2);
    expect(audio.pause).toHaveBeenCalled();

    act(() => vi.runAllTimers());
    expect(audio.currentTime).toBe(5);

    audio.currentTime = 6;
    act(() => runFrame());
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
  });

  it('updates ranges without stopping playback', () => {
    const audio = createAudio();
    const { result } = renderHook(() => useTahfeezSession(audio, vi.fn()));

    act(() => {
      result.current.start([{ startTime: 1, endTime: 2 }], 1, 0);
    });
    expect(audio.currentTime).toBe(1);

    act(() => {
      result.current.updateRanges([
        { startTime: 10, endTime: 11 },
        { startTime: 20, endTime: 21 },
      ]);
    });

    expect(audio.currentTime).toBe(10);
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it('keeps the current range when a live update still contains the position', () => {
    const audio = createAudio();
    const { result } = renderHook(() => useTahfeezSession(audio, vi.fn()));

    act(() => {
      result.current.start(
        [
          { startTime: 1, endTime: 2 },
          { startTime: 5, endTime: 6 },
        ],
        1,
        0
      );
    });

    audio.currentTime = 5.5;
    act(() => {
      result.current.updateRanges([
        { startTime: 1, endTime: 2 },
        { startTime: 5, endTime: 6.5 },
      ]);
    });

    expect(audio.currentTime).toBe(5.5);
  });

  it('attaches listeners when the audio element mounts later', () => {
    const onActiveChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ audio }: { audio: HTMLAudioElement | null }) =>
        useTahfeezSession(audio, onActiveChange),
      { initialProps: { audio: null as HTMLAudioElement | null } }
    );

    expect(result.current.audioPlaying).toBe(false);

    const audio = createAudio();
    rerender({ audio });

    act(() => {
      audio.paused = false;
      audio.emit('play');
    });
    expect(result.current.audioPlaying).toBe(true);

    act(() => {
      audio.paused = true;
      audio.emit('pause');
    });
    expect(result.current.audioPlaying).toBe(false);
  });

  it('stops the session and resets audio', () => {
    const audio = createAudio();
    const onActiveChange = vi.fn();
    const { result } = renderHook(() =>
      useTahfeezSession(audio, onActiveChange)
    );

    act(() => {
      result.current.start([{ startTime: 3, endTime: 4 }], 1, 0);
      result.current.stop();
    });

    expect(audio.pause).toHaveBeenCalled();
    expect(audio.currentTime).toBe(0);
    expect(result.current.isActive()).toBe(false);
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
  });
});
