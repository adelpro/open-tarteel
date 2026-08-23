import { RefObject, useEffect, useRef, useState } from 'react';

export interface TimeRange {
  startTime: number;
  endTime: number;
}

export interface TahfeezSessionControls {
  /** Start a new session. Tears down any existing session first. */
  start: (ranges: TimeRange[], repeat: number, delay: number) => void;
  /** Stop the session and pause audio. */
  stop: () => void;
  /** Smart play/pause: start if idle, resume if paused, pause if playing. */
  handlePlayPause: (ranges: TimeRange[], repeat: number, delay: number) => void;
  /** Whether the audio element is currently playing (DOM-truth, not React state). */
  audioPlaying: boolean;
  /** Whether a session is currently wired up (even if paused mid-delay). */
  isActive: () => boolean;
}

/**
 * Manages a tahfeez (memorisation) audio session.
 *
 * Owns all session refs and engine logic. The consumer (PlayerControls) only
 * needs to call `start` / `handlePlayPause` / `stop` and read `audioPlaying`.
 *
 * @param audioRef        - Ref to the shared HTMLAudioElement.
 * @param onActiveChange  - Called with `true` when a session starts and `false`
 *                          when it ends, so the parent can block auto-advance.
 */
export function useTahfeezSession(
  audioRef: RefObject<HTMLAudioElement | null>,
  onActiveChange: (_active: boolean) => void
): TahfeezSessionControls {
  // ── Engine refs (no re-renders) ──────────────────────
  const cleanupRef = useRef<(() => void) | null>(null);
  const rangesRef = useRef<TimeRange[]>([]);
  const indexRef = useRef(0);
  const repeatCountRef = useRef(0);
  const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live DOM audio state ─────────────────────────────
  const [audioPlaying, setAudioPlaying] = useState(false);

  useEffect(() => {
    let attachedAudio: HTMLAudioElement | null = null;
    const onPlay = () => {
      setAudioPlaying(true);
    };
    const onPause = () => {
      setAudioPlaying(false);
    };

    const attach = (element: HTMLAudioElement) => {
      element.addEventListener('play', onPlay);
      element.addEventListener('pause', onPause);
      attachedAudio = element;
    };
    const detach = (element: HTMLAudioElement) => {
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
    };

    const currentAudio = audioRef.current;
    if (currentAudio) {
      attach(currentAudio);
      return () => {
        detach(currentAudio);
      };
    }

    // audioRef.current may be null on first render — retry after a tick
    const timer = setTimeout(() => {
      const laterAudio = audioRef.current;
      if (laterAudio) attach(laterAudio);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (attachedAudio) detach(attachedAudio);
    };
  }, [audioRef]);

  // ── Helpers ──────────────────────────────────────────
  const isActive = () => cleanupRef.current !== null;

  const teardown = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  // ── Public API ───────────────────────────────────────
  const stop = () => {
    teardown();
    audioRef.current?.pause();
    onActiveChange(false);
  };

  const start = (ranges: TimeRange[], repeat: number, delay: number) => {
    const audio = audioRef.current;
    if (!audio || ranges.length === 0) return;

    teardown(); // stop any existing session

    rangesRef.current = ranges;
    indexRef.current = 0;
    repeatCountRef.current = 0;
    onActiveChange(true);

    const seekToCurrentRange = () => {
      const range: TimeRange | undefined = rangesRef.current[indexRef.current];
      if (!range) return;
      audio.currentTime = range.startTime;
      void audio.play();
    };

    const scheduleNext = () => {
      audio.pause();
      delayTimerRef.current = setTimeout(() => {
        const range: TimeRange | undefined =
          rangesRef.current[indexRef.current];
        if (!range) return;
        audio.currentTime = range.startTime;
        void audio.play();
      }, delay * 1000);
    };

    const handleTimeUpdate = () => {
      const range: TimeRange | undefined = rangesRef.current[indexRef.current];
      if (!range) return;

      if (audio.currentTime >= range.endTime) {
        repeatCountRef.current += 1;

        if (repeatCountRef.current < repeat) {
          scheduleNext();
        } else {
          repeatCountRef.current = 0;
          indexRef.current += 1;

          if (indexRef.current < rangesRef.current.length) {
            scheduleNext();
          } else {
            // All ranges exhausted — stop cleanly
            audio.pause();
            teardown();
            onActiveChange(false);
          }
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    cleanupRef.current = () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (delayTimerRef.current !== null) {
        clearTimeout(delayTimerRef.current);
        delayTimerRef.current = null;
      }
    };

    seekToCurrentRange();
  };

  const handlePlayPause = (
    ranges: TimeRange[],
    repeat: number,
    delay: number
  ) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioPlaying) {
      audio.pause();
    } else if (isActive()) {
      // Session wired but paused — resume at current position
      void audio.play();
    } else {
      // No session — start a new one
      start(ranges, repeat, delay);
    }
  };

  return { start, stop, handlePlayPause, audioPlaying, isActive };
}
