'use client';

import { useAtom, useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useMediaSession } from '@/hooks/use-media-session';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
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

  const isOnline = useNetworkStatus();
  const { isTrackCached } = useOfflineDownload();

  // In offline mode, determine which track indices are cached/playable
  const availableIndices = React.useMemo(() => {
    const indices: number[] = [];
    for (const [index, item] of playlist.entries()) {
      if (isOnline || isTrackCached(item.link)) {
        indices.push(index);
      }
    }
    return indices;
  }, [playlist, isOnline, isTrackCached]);

  // Ensure currentTrack points to a downloaded track when offline
  useEffect(() => {
    if (!isOnline && availableIndices.length > 0) {
      if (
        typeof currentTrack !== 'number' ||
        !availableIndices.includes(currentTrack)
      ) {
        setCurrentTrack(availableIndices[0]);
      }
    }
  }, [isOnline, availableIndices, currentTrack]);

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
    const pool = [...availableIndices];
    for (let index = pool.length - 1; index > 0; index--) {
      const index_ = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[index_]] = [pool[index_], pool[index]];
    }
    setShuffledIndices(pool);
  }, [availableIndices]);

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

  // Mirror DOM audio events → React state so that external play/pause
  // (e.g. tahfeez session, browser media buttons) keeps the icon in sync.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      setIsPlaying(true);
    };
    const onPause = () => {
      setIsPlaying(false);
    };
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (!isOnline && availableIndices.length === 0) return;
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

  const getNextTrackIndex = useCallback(
    (index: number) => {
      if (availableIndices.length === 0) return index;

      if (playbackMode === 'shuffle') {
        const pool =
          shuffledIndices.length > 0 ? shuffledIndices : availableIndices;
        const currentPos = pool.indexOf(index);
        const nextPos = (currentPos + 1) % pool.length;
        return pool[nextPos];
      }

      const currentPos = availableIndices.indexOf(index);
      if (currentPos === -1) return availableIndices[0];
      const nextPos = (currentPos + 1) % availableIndices.length;
      return availableIndices[nextPos];
    },
    [availableIndices, playbackMode, shuffledIndices]
  );

  const getPreviousTrackIndex = useCallback(
    (index: number) => {
      if (availableIndices.length === 0) return index;

      if (playbackMode === 'shuffle') {
        const pool =
          shuffledIndices.length > 0 ? shuffledIndices : availableIndices;
        const currentPos = pool.indexOf(index);
        const previousPos = (currentPos - 1 + pool.length) % pool.length;
        return pool[previousPos];
      }

      const currentPos = availableIndices.indexOf(index);
      if (currentPos === -1) return availableIndices[0];
      const previousPos =
        (currentPos - 1 + availableIndices.length) % availableIndices.length;
      return availableIndices[previousPos];
    },
    [availableIndices, playbackMode, shuffledIndices]
  );

  const handleNextTrack = useCallback(() => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getNextTrackIndex(currentTrack));
  }, [currentTrack, getNextTrackIndex]);

  const handlePreviousTrack = useCallback(() => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getPreviousTrackIndex(currentTrack));
  }, [currentTrack, getPreviousTrackIndex]);

  const handleTrackEnded = () => {
    // Don't auto-advance while a tahfeez session is still repeating
    if (tahfeezActiveRef.current) return;

    if (playbackMode === 'repeat-one') {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        if (isPlaying) {
          void audioRef.current.play();
        }
      }
    } else {
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
      if (!isOnline && availableIndices.length === 0) return;
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
          {!isOnline && availableIndices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
              <FormattedMessage
                id="offline.noDownloadedSurahs"
                defaultMessage="No downloaded surahs for this reciter. Connect to the internet to stream or download."
              />
            </div>
          ) : (
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
          )}

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
