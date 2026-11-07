import { useEffect, useRef, useState } from 'react';

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export interface TahfeezSessionControls {
  /** Start a new session. Tears down any existing session first. */
  start: (_ranges: TimeRange[], _repeat: number, _delay: number) => void;
  /** Stop the session and pause audio. */
  stop: () => void;
  /** Replace the ranges of a running session without interrupting playback. */
  updateRanges: (_ranges: TimeRange[]) => void;
  /** Update repeat/delay without restarting the session. */
  updateSettings: (_repeat: number, _delay: number) => void;
  /** Smart play/pause: start if idle, resume if paused, pause if playing. */
  handlePlayPause: (
    _ranges: TimeRange[],
    _repeat: number,
    _delay: number
  ) => void;
  /** Whether the audio element is currently playing (DOM-truth, not React state). */
  audioPlaying: boolean;
  /** Whether a session is currently wired up (even if paused mid-delay). */
  isActive: () => boolean;
}

const findRangeIndex = (ranges: TimeRange[], time: number): number => {
  const exact = ranges.findIndex(
    (range) => time >= range.startTime && time <= range.endTime
  );
  if (exact !== -1) return exact;

  // Outside every range: pick the nearest one so a settings change resumes
  // from a sensible place instead of jumping to the first ayah.
  let nearest = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;
  for (const [index, range] of ranges.entries()) {
    const distance = Math.min(
      Math.abs(time - range.startTime),
      Math.abs(time - range.endTime)
    );
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = index;
    }
  }
  return nearest;
};

/**
 * Manages a tahfeez (memorisation) audio session.
 *
 * Owns all session refs and engine logic. The consumer (PlayerControls) only
 * needs to call `start` / `handlePlayPause` / `updateRanges` / `stop` and read
 * `audioPlaying`.
 *
 * @param audioElement    - The shared HTMLAudioElement, or null until it mounts.
 * @param onActiveChange  - Called with `true` when a session starts and `false`
 *                          when it ends, so the parent can block auto-advance.
 */
export function useTahfeezSession(
  audioElement: HTMLAudioElement | null,
  onActiveChange: (_active: boolean) => void
): TahfeezSessionControls {
  // ── Engine refs (no re-renders) ──────────────────────
  const cleanupRef = useRef<(() => void) | null>(null);
  const rangesRef = useRef<TimeRange[]>([]);
  const indexRef = useRef(0);
  const repeatCountRef = useRef(0);
  const repeatRef = useRef(1);
  const delayRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);

  // ── Live DOM audio state ─────────────────────────────
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    if (!audioElement) return;

    const onPlay = () => {
      setAudioPlaying(true);
    };
    const onPause = () => {
      setAudioPlaying(false);
    };

    audioElement.addEventListener('play', onPlay);
    audioElement.addEventListener('pause', onPause);
    setAudioPlaying(!audioElement.paused);

    return () => {
      audioElement.removeEventListener('play', onPlay);
      audioElement.removeEventListener('pause', onPause);
    };
  }, [audioElement]);

  // ── Helpers ──────────────────────────────────────────
  const isActive = () => cleanupRef.current !== null;

  const clearDelay = () => {
    if (delayTimerRef.current !== null) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  };

  const cancelFrame = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  const teardown = () => {
    clearDelay();
    cancelFrame();
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  // ── Public API ───────────────────────────────────────
  const stop = () => {
    // Clean stop - cancel any pending delays and reset audio
    teardown();

    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    onActiveChange(false);
  };

  const start = (ranges: TimeRange[], repeat: number, delay: number) => {
    const audio = audioElement;
    if (!audio || ranges.length === 0) return;

    teardown(); // stop any existing session

    rangesRef.current = ranges;
    indexRef.current = 0;
    repeatCountRef.current = 0;
    repeatRef.current = repeat;
    delayRef.current = delay;
    onActiveChange(true);

    const seekToCurrentRange = () => {
      const currentRange = rangesRef.current.at(indexRef.current);
      if (currentRange) {
        audio.currentTime = currentRange.startTime;
        void audio.play();
      }
    };

    const scheduleNext = () => {
      audio.pause();
      clearDelay();
      delayTimerRef.current = setTimeout(() => {
        delayTimerRef.current = null; // allow the frame loop to run again
        seekToCurrentRange();
      }, delayRef.current * 1000);
    };

    const finish = () => {
      audio.pause();
      teardown();
      onActiveChange(false);
    };

    const advance = () => {
      const currentRange = rangesRef.current.at(indexRef.current);
      if (currentRange) {
        // Pin to the boundary so the next range never inherits overshoot.
        audio.currentTime = currentRange.endTime;
      }
      audio.pause();

      repeatCountRef.current += 1;
      if (repeatCountRef.current < repeatRef.current) {
        scheduleNext();
        return;
      }

      repeatCountRef.current = 0;
      indexRef.current += 1;
      if (indexRef.current < rangesRef.current.length) {
        scheduleNext();
      } else {
        finish();
      }
    };

    // requestAnimationFrame checks the boundary every frame instead of every
    // ~250 ms, so playback no longer bleeds into the following ayah.
    const tick = () => {
      if (delayTimerRef.current !== null) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const currentRange = rangesRef.current.at(indexRef.current);
      if (!currentRange) {
        finish();
        return;
      }

      if (audio.currentTime >= currentRange.endTime) {
        advance();
      }

      if (cleanupRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    cleanupRef.current = () => {
      // Marker only; teardown cancels the frame and delay timers.
    };

    frameRef.current = requestAnimationFrame(tick);
    seekToCurrentRange();
  };

  const updateRanges = (ranges: TimeRange[]) => {
    if (ranges.length === 0) return;

    rangesRef.current = ranges;
    const time = audioElement?.currentTime ?? ranges[0]?.startTime ?? 0;
    const nextIndex = findRangeIndex(ranges, time);
    const nextRange = ranges[nextIndex];

    indexRef.current = nextIndex;
    repeatCountRef.current = 0;

    if (
      audioElement &&
      nextRange &&
      (time < nextRange.startTime || time > nextRange.endTime)
    ) {
      audioElement.currentTime = nextRange.startTime;
    }
  };

  const updateSettings = (repeat: number, delay: number) => {
    repeatRef.current = repeat;
    delayRef.current = delay;
  };

  const handlePlayPause = (
    ranges: TimeRange[],
    repeat: number,
    delay: number
  ) => {
    const audio = audioElement;
    if (!audio) return;

    if (audioPlaying) {
      audio.pause();
    } else if (isActive()) {
      // Session wired but paused — resume at current position
      void audio.play();
    } else {
      start(ranges, repeat, delay);
    }
  };

  return {
    start,
    stop,
    updateRanges,
    updateSettings,
    handlePlayPause,
    audioPlaying,
    isActive,
  };
}
