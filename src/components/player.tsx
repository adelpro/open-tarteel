// components/Player.tsx
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Removed: import ReactAudioSpectrum from 'react-audio-spectrum'; // No longer needed here
import { currentTimeAtom, showVisualizerAtom, volumeAtom } from '@/jotai/atom';
import { Playlist } from '@/types';

import AudioVisualizer from './audio-visualizer'; // Import the new component
import PlayerControls from './player-controls';
import PlaylistDialog from './playlist-dialog';
import Range from './range';
import TrackInfo from './track-info';

type Props = {
  playlist: Playlist;
};

export default function Player({ playlist }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [duration, setDuration] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<number | undefined>(0);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Removed: const showVisualizer = useAtomValue(showVisualizerAtom); // Still needed for PlayerControls logic, but not directly for visualizer rendering here
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  // Removed: const [visualizerWidth, setVisualizerWidth] = useState(400); // Moved to AudioVisualizer
  const volumeValue = useAtomValue(volumeAtom);

  // Removed: visualizerWidth useEffect // Moved to AudioVisualizer

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

    // Reset currentTime to 0 whenever the track changes (or on initial mount for track 0)
    // This ensures consistency between server and client for the starting point of a track,
    // preventing hydration errors and ensuring tracks restart on refresh.
    setCurrentTime(0);

    if (audioRef.current && isPlaying) {
      audioRef.current.currentTime = 0; // Ensure the actual audio element starts from 0 if playing
      audioRef.current.play();
    }
  }, [currentTrack, isPlaying, setCurrentTime]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef?.current) return;

    if (!Number.isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }

    if (!Number.isNaN(audioRef.current.currentTime)) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePreviousTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getPreviousTrackIndex(currentTrack));
  };

  const handleNextTrack = () => {
    if (typeof currentTrack !== 'number') return;
    setCurrentTrack(getNextTrackIndex(currentTrack));
  };

  const toggleShuffle = () => {
    if (!isShuffled) {
      shufflePlaylist();
    }
    setIsShuffled(!isShuffled);
  };

  const togglePlaylistOpen = () => {
    setIsOpen(!isOpen);
  };

  const getNextTrackIndex = (currentIndex: number) => {
    if (isShuffled) {
      const currentShuffledIndex = shuffledIndices.indexOf(currentIndex);
      return shuffledIndices[(currentShuffledIndex + 1) % playlist.length];
    }
    return (currentIndex + 1) % playlist.length;
  };

  const getPreviousTrackIndex = (currentIndex: number) => {
    if (isShuffled) {
      const currentShuffledIndex = shuffledIndices.indexOf(currentIndex);
      return shuffledIndices[
        (currentShuffledIndex - 1 + playlist.length) % playlist.length
      ];
    }
    return (currentIndex - 1 + playlist.length) % playlist.length;
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-md border border-slate-200 p-4 shadow-md transition-transform hover:scale-105">
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

          <AudioVisualizer audioId="audio" isPlaying={isPlaying} />

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
        </>
      )}

      {typeof currentTrack === 'number' && (
        <TrackInfo
          currentTrackId={currentTrack}
          duration={duration}
          currentTime={currentTime}
        />
      )}
    </div>
  );
}
