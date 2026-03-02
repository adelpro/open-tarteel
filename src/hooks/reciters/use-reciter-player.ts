'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import {
  isPlayingAtom,
  playerPlaylistAtom,
  playerSourceAtom,
  playerTrackIndexAtom,
} from '@/jotai/player';
import { toPlayerTracks } from '@/utils';

import { useActiveReciter } from '../use-active-reciter';

export function useReciterPlayer() {
  const { reciter, playlist } = useActiveReciter();

  const setPlayerPlaylist = useSetAtom(playerPlaylistAtom);
  const setTrackIndex = useSetAtom(playerTrackIndexAtom);
  const setPlayerSource = useSetAtom(playerSourceAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);

  const playReciterTrack = useCallback(
    (index: number) => {
      if (!playlist || !reciter) return;

      const playerTracks = toPlayerTracks({ playlist, reciter });
      setPlayerPlaylist(playerTracks);
      setTrackIndex(index);
      setPlayerSource('reciter');
      setIsPlaying(true);
    },
    [
      playlist,
      reciter,
      setPlayerPlaylist,
      setTrackIndex,
      setPlayerSource,
      setIsPlaying,
    ]
  );

  const loadReciterPlaylist = useCallback(() => {
    if (!playlist || !reciter) return;

    const playerTracks = toPlayerTracks({ playlist, reciter });
    setPlayerPlaylist(playerTracks);
    setPlayerSource('reciter');
  }, [playlist, reciter, setPlayerPlaylist, setPlayerSource]);

  return { playReciterTrack, loadReciterPlaylist };
}
