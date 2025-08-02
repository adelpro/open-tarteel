import fullScreenSVG from '@svgs/fullscreen.svg';
import fullscreenExitSVG from '@svgs/fullscreen-exit.svg';
import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import repeatSVG from '@svgs/music-repeat.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import spectrumSVG from '@svgs/spectrum.svg';
import spectrumDisabledSVG from '@svgs/spectrum-disabled.svg';
import { useAtom } from 'jotai';
import Image from 'next/image';
import React, { RefObject, useEffect, useState } from 'react';
import {
  BiExitFullscreen,
  BiFullscreen,
  BiVolumeFull,
  BiVolumeMute,
} from 'react-icons/bi';
import { BsFullscreen, BsFullscreenExit } from 'react-icons/bs';

import { fullscreenAtom, showVisualizerAtom, volumeAtom } from '@/jotai/atom';
import { cn } from '@/utils';

type Props = {
  handleNextTrack: () => void;
  togglePlayPause: () => void;
  toggleShuffle: () => void;
  togglePlaylistOpen: () => void;
  isShuffled: boolean;
  isPlaying: boolean;
  handlePreviousTrack: () => void;
  volumeRef: RefObject<HTMLDivElement | null>;
};

export default function PlayerControls({
  handleNextTrack,
  togglePlayPause,
  toggleShuffle,
  togglePlaylistOpen,
  isShuffled,
  isPlaying,
  handlePreviousTrack,
  volumeRef,
}: Props) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [isFullscreen, setIsFullscreen] = useAtom(fullscreenAtom);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        volumeRef.current &&
        !volumeRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    }

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider, volumeRef]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  if (isFullscreen) {
    // Minimal fullscreen controls UI
    return (
      <div className="flex items-center justify-center gap-8 py-6">
        <button
          onClick={handleNextTrack}
          className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Next track"
        >
          <Image src={forwardSVG} alt="next" width={50} height={50} />
        </button>
        <button
          onClick={togglePlayPause}
          className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <Image
            src={isPlaying ? pauseSVG : playSVG}
            alt="play/pause"
            width={60}
            height={60}
            className={cn({
              'animate-slideInWithFade': isPlaying,
            })}
          />
        </button>
        <button
          onClick={handlePreviousTrack}
          className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Previous track"
        >
          <Image src={backwardSVG} alt="previous" width={50} height={50} />
        </button>
      </div>
    );
  }

  // Default controls UI (non-fullscreen)
  return (
    <div
      className="relative flex w-full items-center justify-between gap-2 md:gap-4"
      dir="rtl"
    >
      {/* Volume control */}
      <div
        className="relative flex touch-none items-center"
        ref={volumeRef}
        style={{ touchAction: 'none' }} // prevent scroll during drag
      >
        <button
          onClick={toggleFullscreen}
          className="rounded p-2 hover:bg-gray-200"
          aria-label="Toggle fullscreen"
        >
          {isFullscreen ? <BsFullscreenExit /> : <BsFullscreen />}
        </button>
        <button
          onClick={() => setShowVolumeSlider((v) => !v)}
          className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Volume control"
        >
          {volume === 0 ? (
            <BiVolumeMute
              size={24}
              color="#6b7280"
              className={cn({
                'animate-slideInWithFade': isShuffled,
              })}
            />
          ) : (
            <BiVolumeFull size={24} color="#6b7280" />
          )}
        </button>

        {showVolumeSlider && (
          <div className="absolute bottom-12 left-1/2 flex h-24 w-10 -translate-x-1/2 items-center justify-center md:w-6">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-full w-2 cursor-pointer appearance-none bg-transparent"
              style={{
                writingMode: 'vertical-lr',
                WebkitAppearance: 'slider-vertical',
                background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${
                  volume * 100
                }%, #cbd5e1 ${volume * 100}%, #cbd5e1 100%)`,
                borderRadius: '9999px',
              }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleNextTrack}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Next track"
      >
        <Image src={forwardSVG} alt="next" width={30} height={30} />
      </button>

      <button
        onClick={togglePlayPause}
        className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Image
          src={isPlaying ? pauseSVG : playSVG}
          alt="play-pause"
          width={30}
          height={30}
          className={cn({
            'animate-slideInWithFade': isPlaying,
          })}
        />
      </button>

      <button
        onClick={handlePreviousTrack}
        className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Previous track"
      >
        <Image src={backwardSVG} alt="previous" width={30} height={30} />
      </button>

      <button
        onClick={toggleShuffle}
        className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Shuffle"
      >
        <Image
          src={isShuffled ? shuffleSVG : repeatSVG}
          alt="shuffle/repeat"
          width={30}
          height={30}
          className={cn({
            'animate-slideInWithFade': isShuffled,
          })}
        />
      </button>

      <button
        onClick={() => setShowVisualizer((v) => !v)}
        className={cn(
          'rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700',
          isPlaying && 'pointer-events-none cursor-not-allowed opacity-30'
        )}
        disabled={isPlaying}
        aria-disabled={isPlaying}
        aria-label="Toggle Visualizer"
      >
        <Image
          src={showVisualizer ? spectrumSVG : spectrumDisabledSVG}
          alt="spectrum disabled"
          width={30}
          height={30}
          className={cn({
            'animate-slideInWithFade': showVisualizer,
          })}
        />
      </button>

      <button
        onClick={togglePlaylistOpen}
        className="rounded p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Playlist"
      >
        <Image src={playlistSVG} alt="playlist" width={30} height={30} />
      </button>
    </div>
  );
}
