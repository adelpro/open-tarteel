import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import { Playlist } from '@/types';

type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playlist: Playlist;
  currentTrackId: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function useMediaSession({
  audioRef,
  playlist,
  currentTrackId,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const track = playlist[currentTrackId];
    if (!track || !selectedReciter) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Surah ${track.surahId}`,
      artist: selectedReciter.name,
      album: selectedReciter.moshaf.name,
      artwork: [
        {
          src: '/logo.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play', onPlay);
    navigator.mediaSession.setActionHandler('pause', onPause);
    navigator.mediaSession.setActionHandler('previoustrack', onPrev);
    navigator.mediaSession.setActionHandler('nexttrack', onNext);
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;
      navigator.mediaSession.setPositionState({
        duration: audio.duration || 0,
        playbackRate: audio.playbackRate || 1,
        position: audio.currentTime || 0,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    playlist,
    currentTrackId,
    isPlaying,
    onPlay,
    onPause,
    onNext,
    onPrev,
    audioRef,
    selectedReciter,
  ]);
}
