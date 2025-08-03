'use client';

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
import { BiVolumeFull, BiVolumeMute } from 'react-icons/bi';
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

const ICON_SIZE = 24;

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

  const renderImageButton = (
    source: string,
    alt: string,
    onClick: () => void,
    extraClass?: string,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700',
        extraClass
      )}
      aria-label={alt}
    >
      <Image src={source} alt={alt} width={ICON_SIZE} height={ICON_SIZE} />
    </button>
  );

  if (isFullscreen) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        {renderImageButton(forwardSVG, 'next', handleNextTrack)}
        {renderImageButton(
          isPlaying ? pauseSVG : playSVG,
          isPlaying ? 'pause' : 'play',
          togglePlayPause,
          isPlaying ? 'animate-slideInWithFade' : ''
        )}
        {renderImageButton(backwardSVG, 'previous', handlePreviousTrack)}
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full items-center justify-between gap-2 md:gap-3"
      dir="rtl"
    >
      {/* Fullscreen */}
      <button
        onClick={toggleFullscreen}
        className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200"
        aria-label="Toggle fullscreen"
      >
        {isFullscreen ? (
          <BsFullscreenExit size={ICON_SIZE} color="#6b7280" />
        ) : (
          <BsFullscreen size={ICON_SIZE} color="#6b7280" />
        )}
      </button>
      {/* Volume */}
      <div
        className="relative flex items-center gap-2"
        ref={volumeRef}
        style={{ touchAction: 'none' }}
      >
        <button
          onClick={() => setShowVolumeSlider((previous) => !previous)}
          className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200"
          aria-label="Toggle volume"
        >
          {volume > 0 ? (
            <BiVolumeFull size={ICON_SIZE} color="#6b7280" />
          ) : (
            <BiVolumeMute size={ICON_SIZE} color="#6b7280" />
          )}
        </button>

        {showVolumeSlider && (
          <div className="absolute bottom-10 left-1/2 flex h-20 w-6 -translate-x-1/2 items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-full w-1 cursor-pointer appearance-none bg-transparent"
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

      {renderImageButton(forwardSVG, 'next', handleNextTrack)}
      {renderImageButton(
        isPlaying ? pauseSVG : playSVG,
        isPlaying ? 'pause' : 'play',
        togglePlayPause,
        isPlaying ? 'animate-slideInWithFade' : ''
      )}
      {renderImageButton(backwardSVG, 'previous', handlePreviousTrack)}
      {renderImageButton(
        isShuffled ? shuffleSVG : repeatSVG,
        'shuffle/repeat',
        toggleShuffle,
        isShuffled ? 'animate-slideInWithFade' : ''
      )}
      {renderImageButton(
        showVisualizer ? spectrumSVG : spectrumDisabledSVG,
        'spectrum',
        () => setShowVisualizer((v) => !v),
        isPlaying ? 'pointer-events-none cursor-not-allowed opacity-30' : '',
        isPlaying
      )}
      {renderImageButton(playlistSVG, 'playlist', togglePlaylistOpen)}
    </div>
  );
}
