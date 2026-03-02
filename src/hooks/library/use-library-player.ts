'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import {
  isPlayingAtom,
  playerPlaylistAtom,
  playerSourceAtom,
  playerTrackIndexAtom,
} from '@/jotai/player';
import type { Track } from '@/types';

export function useLibraryPlayer() {
  const setPlayerPlaylist = useSetAtom(playerPlaylistAtom);
  const setTrackIndex = useSetAtom(playerTrackIndexAtom);
  const setPlayerSource = useSetAtom(playerSourceAtom);
  const setIsPlaying = useSetAtom(isPlayingAtom);

  /**
   * Load a filtered list (e.g. "recent" tab, "bookmarks" tab, "all downloads")
   * and play a specific track from it.
   *
   * @param tracks  — the filtered list (becomes the player queue)
   * @param track   — the track to play immediately (must be in tracks)
   */
  const playLibraryTrack = useCallback(
    (tracks: Track[], track: Track) => {
      const index = tracks.findIndex((t) => t.id === track.id);
      if (index === -1) return;

      setPlayerPlaylist(tracks);
      setTrackIndex(index);
      setPlayerSource('library');
      setIsPlaying(true);
    },
    [setPlayerPlaylist, setTrackIndex, setPlayerSource, setIsPlaying]
  );

  /**
   * Play a single track standalone (e.g. from a search result).
   * Sets a single-item playlist.
   */
  const playTrack = useCallback(
    (track: Track) => {
      setPlayerPlaylist([track]);
      setTrackIndex(0);
      setPlayerSource('library');
      setIsPlaying(true);
    },
    [setPlayerPlaylist, setTrackIndex, setPlayerSource, setIsPlaying]
  );

  return { playLibraryTrack, playTrack };
}
