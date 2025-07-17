import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import repeatSVG from '@svgs/music-repeat.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import Image from 'next/image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactAudioSpectrum from 'react-audio-spectrum';
import { TbAntennaBars5, TbAntennaBarsOff } from 'react-icons/tb';

import { Playlist } from '@/types';

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
  const [showVisualizer, setShowVisualizer] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

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
                width={Math.min(window.innerWidth * 0.9, 400)}
                capColor="#4ade80"
                meterWidth={4}
                meterColor="#10b981"
                gap={4}
              />
            </div>
          ) : (
            <></>
          )}

          <div className="flex w-full items-center justify-between gap-2 pt-5 md:gap-6">
            <button
              onClick={handlePreviousTrack}
              className="rounded p-2 hover:bg-gray-200"
              aria-label="Previous track"
            >
              <Image src={backwardSVG} alt="previous" width={30} height={30} />
            </button>
            <button
              onClick={togglePlayPause}
              className="rounded p-2 hover:bg-gray-200"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Image src={pauseSVG} alt="pause" width={30} height={30} />
              ) : (
                <Image src={playSVG} alt="play" width={30} height={30} />
              )}
            </button>
            <button
              onClick={handleNextTrack}
              className="rounded p-2 hover:bg-gray-200"
              aria-label="Next track"
            >
              <Image src={forwardSVG} alt="next" width={30} height={30} />
            </button>
            <button
              onClick={toggleShuffle}
              className="rounded p-2 hover:bg-gray-200"
              aria-label="Shuffle"
            >
              <Image
                src={isShuffled ? shuffleSVG : repeatSVG}
                alt="shuffle/repeat"
                width={30}
                height={30}
              />
            </button>
            {/* New toggle visualizer button */}
            <button
              onClick={() => setShowVisualizer((v) => !v)}
              className="rounded p-2 hover:bg-gray-200"
              aria-pressed={showVisualizer}
              aria-label="Toggle Visualizer"
            >
              {showVisualizer ? (
                <TbAntennaBars5 size={24} />
              ) : (
                <TbAntennaBarsOff size={24} />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded p-2 hover:bg-gray-200"
              aria-label="Playlist"
            >
              <Image src={playlistSVG} alt="playlist" width={30} height={30} />
            </button>
          </div>

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
