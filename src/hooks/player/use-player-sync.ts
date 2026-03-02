'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

import { playbackModeAtom, playbackSpeedAtom, volumeAtom } from '@/jotai';
import {
  activeTrackAtom,
  playerPlaylistAtom,
  playerTrackIndexAtom,
} from '@/jotai/player';
import { isPlayingAtom, shuffledIndicesAtom } from '@/jotai/player-atoms';
import { globalAudioRef } from '@/lib/audio-ref';

export function usePlayerSync() {
  const track = useAtomValue(activeTrackAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const trackIndex = useAtomValue(playerTrackIndexAtom);
  const volume = useAtomValue(volumeAtom);
  const playbackSpeed = useAtomValue(playbackSpeedAtom);
  const playbackMode = useAtomValue(playbackModeAtom);
  const playlist = useAtomValue(playerPlaylistAtom);
  const setShuffledIndices = useSetAtom(shuffledIndicesAtom);

  const previousTrackIndexRef = useRef<number | undefined>(undefined);
  const isFirstMountRef = useRef(true);
  // True when play was requested but audio src is still loading.
  const pendingPlayRef = useRef(false);

  // ── canplay listener — attached once ─────────────────────────────────────
  useEffect(() => {
    if (!globalAudioRef.current) return;

    if (isPlaying) {
      const playPromise = globalAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // src not ready yet — mark as pending, Effect 2 will handle it
          pendingPlayRef.current = true;
        });
      }
    } else {
      pendingPlayRef.current = false;
      globalAudioRef.current.pause();
    }
  }, [isPlaying]);

  // Effect 2: When track changes, load new src and auto-play if isPlaying
  useEffect(() => {
    if (!globalAudioRef.current || !track?.link) return;

    const audio = globalAudioRef.current;

    // Load the new source
    audio.src = track.link;
    audio.load();

    if (isPlaying) {
      pendingPlayRef.current = true;

      const handleCanPlay = () => {
        if (pendingPlayRef.current) {
          pendingPlayRef.current = false;
          audio.play().catch(() => {});
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };

      audio.addEventListener('canplay', handleCanPlay);

      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [track?.link]);
  // ── Play / pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = globalAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.readyState >= 2) {
        // Audio is ready — play immediately
        audio.play().catch((err) => {
          if (err?.name !== 'AbortError') {
            console.warn(
              '[PlayerSync] play() rejected:',
              err.name,
              err.message
            );
          }
        });
      } else {
        // Src is loading — defer to canplay
        pendingPlayRef.current = true;
      }
    } else {
      pendingPlayRef.current = false;
      audio.pause();
    }
  }, [isPlaying]);

  // ── Track change ──────────────────────────────────────────────────────────
  useEffect(() => {
    const previous = previousTrackIndexRef.current;
    previousTrackIndexRef.current = trackIndex;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }

    if (previous === trackIndex) return;

    const audio = globalAudioRef.current;
    if (!audio) return;

    // Mark play as pending BEFORE load() so canplay sees it
    if (isPlaying) pendingPlayRef.current = true;

    // Force browser to re-read the new src React set on the element.
    // Without load(), some browsers continue playing the old src.
    audio.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]); // isPlaying excluded — track-change only

  // ── Volume ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // ── Playback speed ────────────────────────────────────────────────────────
  useEffect(() => {
    if (globalAudioRef.current)
      globalAudioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // ── Shuffle ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (playbackMode !== 'shuffle' || !playlist.length) return;
    const indices = Array.from(
      { length: playlist.length },
      (_, index) => index
    );
    for (let index = indices.length - 1; index > 0; index--) {
      const index_ = Math.floor(Math.random() * (index + 1));
      [indices[index], indices[index_]] = [indices[index_], indices[index]];
    }
    setShuffledIndices(indices);
  }, [playbackMode, playlist.length, setShuffledIndices]);
}
