import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactAudioSpectrum from 'react-audio-spectrum';

import { showVisualizerAtom } from '@/jotai/atom';
import { Playlist } from '@/types';

import PlayerControls from './player-controls';
import PlaylistDialog from './playlist-dialog';
import Range from './range';
import TrackInfo from './track-info';

type Props = {
  playlist: Playlist;
};

export default function Player({ playlist }: Props) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<number | undefined>(0);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const showVisualizer = useAtomValue(showVisualizerAtom);
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const [visualizerWidth, setVisualizerWidth] = useState(400); // Initial fallback width

  useEffect(() => {
    // This code only runs on the client-side after the component mounts
    const calculateWidth = () => {
      setVisualizerWidth(Math.min(window.innerWidth * 0.8, 400));
    };

    // Set initial width
    calculateWidth();

    // Add event listener for window resize to update width dynamically
    window.addEventListener('resize', calculateWidth);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('resize', calculateWidth);
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

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
    if (audioRef.current && isPlaying) {
      audioRef.current.play();
    }
  }, [currentTrack, isPlaying]);

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
          {showVisualizer ? (
            <div className="mb-4 w-full">
              <ReactAudioSpectrum
                id="audio-spectrum"
                audioId="audio"
                height={100}
                width={visualizerWidth}
                capColor="#0191e2"
                meterWidth={10}
                meterColor="#0191e2"
                gap={4}
              />
            </div>
          ) : (
            <></>
          )}

          <PlayerControls
            isPlaying={isPlaying}
            volumeRef={volumeRef}
            togglePlayPause={togglePlayPause}
            handlePreviousTrack={handlePreviousTrack}
            handleNextTrack={handleNextTrack}
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
