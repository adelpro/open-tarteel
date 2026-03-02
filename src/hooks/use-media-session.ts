import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

import { selectedReciterAtom } from '@/jotai/atoms';
import { PlayerTrack, Playlist } from '@/types';
import { getSurahInfo, removeTashkeel } from '@/utils';
type Props = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playlist?: Playlist;
  track: PlayerTrack | null;
  trackIndex: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function useMediaSession({
  audioRef,
  playlist,
  track,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);

  useEffect(() => {
    if (
      !('mediaSession' in navigator) ||
      !playlist ||
      !track ||
      !selectedReciter
    )
      return;

    const { name } = getSurahInfo(track.surahId);

    const surahName = removeTashkeel(name);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${track.surahId} - ${surahName}`,
      artist: selectedReciter.name,
      album: selectedReciter.moshaf.name,
      artwork: [
        {
          src: '/images/512x512.png',
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
    isPlaying,
    onPlay,
    onPause,
    onNext,
    onPrev,
    audioRef,
    selectedReciter,
    track,
  ]);
}
