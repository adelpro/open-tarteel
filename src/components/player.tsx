'use client';

import { useAtom, useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaSession } from '@/hooks/use-media-session';
import {
  currentTimeAtom,
  fullscreenAtom,
  playbackModeAtom,
  playbackSpeedAtom,
  volumeAtom,
} from '@/jotai/atom';
import { Playlist } from '@/types';
import { cn } from '@/utils';

import AudioBarsVisualizer from './audio-bars-visualizer';
import PlayerControls from './player-controls';
import Range from './range';
import TrackInfo from './track-info';

const PlaylistDialog = dynamic(
  () =>
    import('@/components/playlist-dialog').then((module_) => module_.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
    ),
  }
);

type Props = {
  playlist: Playlist;
};

export default function Player({ playlist }: Props) {
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackMode] = useAtom(playbackModeAtom);
  const previousTrackRef = useRef<number | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<number | undefined>(0);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  // Shared ref: PlayerControls sets this true while a tahfeez session is running.
  // handleTrackEnded reads it to avoid auto-advancing mid-session.
  const tahfeezActiveRef = useRef(false);
  const volumeValue = useAtomValue(volumeAtom);
  const playbackSpeed = useAtomValue(playbackSpeedAtom);
  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
  }, [volumeValue]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Generate shuffled indices
  const shufflePlaylist = useCallback(() => {
    const indices = Array.from(
      { length: playlist.length },
      (_, index) => index
    );
    for (let index = indices.length - 1; index > 0; index--) {
      const index_ = Math.floor(Math.random() * (index + 1));
      [indices[index], indices[index_]] = [indices[index_], indices[index]];
    }
    setShuffledIndices(indices);
  }, [playlist.length]);

  // Re-shuffle when entering shuffle mode
  useEffect(() => {
    if (playbackMode === 'shuffle') {
      shufflePlaylist();
    }
  }, [playbackMode, shufflePlaylist]);

  // Load new track when currentTrack changes
  useEffect(() => {
    const previousTrack = previousTrackRef.current;
    previousTrackRef.current = currentTrack;

    if (typeof currentTrack !== 'number') return;
    if (previousTrack === currentTrack) return;

    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (isPlaying) {
        void audioRef.current.play();
      }
    }
  }, [currentTrack, isPlaying, setCurrentTime]);

  // Sync play/pause with audio element (driven by React state)
  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? void audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  // Mirror DOM audio events → React state so that external play/pause
  // (e.g. tahfeez session, browser media buttons) keeps the icon in sync.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    // isPlaying is now always in sync with DOM, so this is safe
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    if (!Number.isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
    if (!Number.isNaN(audioRef.current.currentTime)) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const getNextTrackIndex = (index: number) => {
    if (playbackMode === 'shuffle') {
      return shuffledIndices[
        (shuffledIndices.indexOf(index) + 1) % playlist.length
      ];
    }
    return (index + 1) % playlist.length;
  };

  const getPreviousTrackIndex = (index: number) => {
    if (playbackMode === 'shuffle') {
      return shuffledIndices[
        (shuffledIndices.indexOf(index) - 1 + playlist.length) % playlist.length
      ];
    }
    return (index - 1 + playlist.length) % playlist.length;
  };

  const handleNextTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getNextTrackIndex(currentTrack));
  };

  const handlePreviousTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getPreviousTrackIndex(currentTrack));
  };

  const handleTrackEnded = () => {
    // Don't auto-advance while a tahfeez session is still repeating
    if (tahfeezActiveRef.current) return;

    if (playbackMode === 'repeat-one') {
      // Reset UI and audio to start
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (isPlaying) {
          void audioRef.current.play();
        }
      }
    } else {
      // Proceed to next track
      handleNextTrack();
    }
  };

  const togglePlaylistOpen = () => {
    setIsOpen(!isOpen);
  };

  useMediaSession({
    audioRef,
    playlist,
    currentTrackId: currentTrack ?? 0,
    isPlaying,
    onPlay: () => {
      audioRef.current?.play();
      setIsPlaying(true);
    },
    onPause: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    onNext: handleNextTrack,
    onPrev: handlePreviousTrack,
  });
  return (
    <div
      className={cn(
        'flex w-full max-w-xl flex-col items-center justify-center',
        isFullscreen
          ? 'w-full max-w-xl bg-background text-foreground'
          : 'max-w-xl rounded-md border border-gray-200 p-2 shadow-md transition-transform dark:border-gray-200/50'
      )}
    >
      {typeof currentTrack === 'number' && (
        <div className="flex w-full flex-col items-center justify-center">
          <audio
            ref={audioRef}
            id="audio"
            className="sr-only"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleTimeUpdate}
            onEnded={handleTrackEnded}
            src={playlist[currentTrack]?.link}
            preload="metadata"
            crossOrigin="anonymous"
          />

          <AudioBarsVisualizer audioId="audio" isPlaying={isPlaying} />

          {isFullscreen ? (
            <>
              <PlayerControls
                isPlaying={isPlaying}
                volumeRef={volumeRef}
                audioRef={audioRef}
                togglePlayPause={togglePlayPause}
                handlePreviousTrack={handlePreviousTrack}
                handleNextTrack={handleNextTrack}
                togglePlaylistOpen={togglePlaylistOpen}
                currentTrackId={currentTrack}
                tahfeezActiveRef={tahfeezActiveRef}
              />
              <Range
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                audioRef={audioRef}
              />
              <TrackInfo
                currentTrackId={currentTrack}
                duration={duration}
                currentTime={currentTime}
              />
            </>
          ) : (
            <>
              <PlayerControls
                isPlaying={isPlaying}
                volumeRef={volumeRef}
                audioRef={audioRef}
                togglePlayPause={togglePlayPause}
                handlePreviousTrack={handlePreviousTrack}
                handleNextTrack={handleNextTrack}
                togglePlaylistOpen={togglePlaylistOpen}
                currentTrackId={currentTrack}
                tahfeezActiveRef={tahfeezActiveRef}
              />
              <Range
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                duration={duration}
                audioRef={audioRef}
              />
              <PlaylistDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                setCurrentTrack={setCurrentTrack}
              />
              <TrackInfo
                currentTrackId={currentTrack}
                duration={duration}
                currentTime={currentTime}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
