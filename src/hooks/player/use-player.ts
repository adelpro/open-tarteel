'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useCallback } from 'react';

import { currentTimeAtom, playbackModeAtom } from '@/jotai';
import {
  activeTrackAtom,
  playerPlaylistAtom,
  playerTrackIndexAtom,
} from '@/jotai/player';
import {
  durationAtom,
  isPlayingAtom,
  playlistDialogAtom,
  shuffledIndicesAtom,
} from '@/jotai/player-atoms';
import { globalAudioRef } from '@/lib/audio-ref';

export function usePlayer() {
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [duration, setDuration] = useAtom(durationAtom);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [trackIndex, setTrackIndex] = useAtom(playerTrackIndexAtom);
  const [isPlayListOpen, setIsPlayListOpen] = useAtom(playlistDialogAtom);

  const playlist = useAtomValue(playerPlaylistAtom);
  const track = useAtomValue(activeTrackAtom);
  const playbackMode = useAtomValue(playbackModeAtom);
  const shuffledIndices = useAtomValue(shuffledIndicesAtom);

  // ─────────── Handlers ───────────

  const getNextIndex = useCallback(
    (index: number) => {
      setIsPlaying(true);
      if (!playlist.length) return index;
      return playbackMode === 'shuffle'
        ? shuffledIndices[
            (shuffledIndices.indexOf(index) + 1) % playlist.length
          ]
        : (index + 1) % playlist.length;
    },
    [playlist.length, playbackMode, setIsPlaying, shuffledIndices]
  );

  const getPreviousIndex = useCallback(
    (index: number) => {
      setIsPlaying(true);
      if (!playlist.length) return index;
      return playbackMode === 'shuffle'
        ? shuffledIndices[
            (shuffledIndices.indexOf(index) - 1 + playlist.length) %
              playlist.length
          ]
        : (index - 1 + playlist.length) % playlist.length;
    },
    [playlist.length, playbackMode, setIsPlaying, shuffledIndices]
  );

  const handleNextTrack = useCallback(
    () => setTrackIndex((index) => getNextIndex(index)),
    [setTrackIndex, getNextIndex]
  );

  const handlePreviousTrack = useCallback(
    () => setTrackIndex((index) => getPreviousIndex(index)),
    [setTrackIndex, getPreviousIndex]
  );

  const handleTrackEnded = useCallback(() => {
    if (playbackMode === 'repeat-one') {
      setCurrentTime(0);
      if (globalAudioRef.current) globalAudioRef.current.currentTime = 0;
      if (isPlaying && globalAudioRef.current)
        void globalAudioRef.current.play();
      return;
    }
    handleNextTrack();
  }, [playbackMode, setCurrentTime, handleNextTrack, isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!globalAudioRef.current) return;
    if (!Number.isNaN(globalAudioRef.current.duration))
      setDuration(globalAudioRef.current.duration);
    if (!Number.isNaN(globalAudioRef.current.currentTime))
      setCurrentTime(globalAudioRef.current.currentTime);
  }, [setDuration, setCurrentTime]);

  return {
    track,
    playlist,
    isPlaying,
    duration,
    currentTime,
    trackIndex,
    isPlayListOpen,

    setIsPlaying,
    setTrackIndex,
    setIsPlayListOpen,
    setCurrentTime,

    togglePlaylistOpen: () => setIsPlayListOpen((previous) => !previous),
    togglePlayPause: () => setIsPlaying((previous) => !previous),

    handleNextTrack,
    handlePreviousTrack,
    handleTrackEnded,
    handleTimeUpdate,
  };
}
