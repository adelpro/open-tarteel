'use client';

import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaSession } from '@/hooks/use-media-session';
import { currentTimeAtom, fullscreenAtom, volumeAtom } from '@/jotai/atom';
import { Playlist } from '@/types';
import { cn } from '@/utils';

import AudioBarsVisualizer from './audio-bars-visualizer';
import PlayerControls from './player-controls';
import PlaylistDialog from './playlist-dialog';
import Range from './range';
import TrackInfo from './track-info';

type Props = {
  playlist: Playlist;
};

export default function Player({ playlist }: Props) {
  const isFullscreen = useAtomValue(fullscreenAtom);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [duration, setDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<number | undefined>(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const volumeValue = useAtomValue(volumeAtom);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
  }, [volumeValue]);

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
  }, [playlist]);

  useEffect(() => {
    shufflePlaylist();
  }, [shufflePlaylist]);

  useEffect(() => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTime(0);
    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, [currentTrack, isPlaying, setCurrentTime]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
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

  const getNextTrackIndex = (index: number) =>
    isShuffled
      ? shuffledIndices[(shuffledIndices.indexOf(index) + 1) % playlist.length]
      : (index + 1) % playlist.length;

  const getPreviousTrackIndex = (index: number) =>
    isShuffled
      ? shuffledIndices[
          (shuffledIndices.indexOf(index) - 1 + playlist.length) %
            playlist.length
        ]
      : (index - 1 + playlist.length) % playlist.length;

  const handleNextTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getNextTrackIndex(currentTrack));
  };

  const handlePreviousTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getPreviousTrackIndex(currentTrack));
  };

  const toggleShuffle = () => {
    if (!isShuffled) shufflePlaylist();
    setIsShuffled(!isShuffled);
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
        'flex w-full flex-col items-center justify-center',
        isFullscreen
          ? 'text-forground w-full bg-background'
          : 'max-w-md rounded-md border border-slate-200 p-2 shadow-md transition-transform hover:scale-105'
      )}
    >
      {typeof currentTrack === 'number' && (
        <>
          <audio
            ref={audioRef}
            id="audio"
            className="sr-only"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleTimeUpdate}
            onEnded={handleNextTrack}
            src={playlist[currentTrack]?.link}
            preload="auto"
            crossOrigin="anonymous"
          />

          <AudioBarsVisualizer audioId="audio" isPlaying={isPlaying} />

          {isFullscreen ? (
            <>
              {/* Minimal fullscreen controls */}
              <PlayerControls
                isPlaying={isPlaying}
                volumeRef={volumeRef}
                togglePlayPause={togglePlayPause}
                handlePreviousTrack={handlePreviousTrack}
                toggleShuffle={toggleShuffle}
                handleNextTrack={handleNextTrack}
                togglePlaylistOpen={togglePlaylistOpen}
                isShuffled={isShuffled}
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
                togglePlayPause={togglePlayPause}
                handlePreviousTrack={handlePreviousTrack}
                toggleShuffle={toggleShuffle}
                handleNextTrack={handleNextTrack}
                togglePlaylistOpen={togglePlaylistOpen}
                isShuffled={isShuffled}
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
        </>
      )}
    </div>
  );
}
