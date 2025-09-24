'use client';

import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import shuffleDisabledSVG from '@svgs/music-shuffle-disabled.svg';
import spectrumSVG from '@svgs/spectrum.svg';
import spectrumDisabledSVG from '@svgs/spectrum-disabled.svg';
import { useAtom, useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { RefObject, useEffect, useState } from 'react';
import { BiVolumeFull, BiVolumeMute } from 'react-icons/bi';
import { BsFullscreen, BsFullscreenExit } from 'react-icons/bs';
import { MdRepeatOne, MdSpeed } from 'react-icons/md';
import { useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import {
  fullscreenAtom,
  playbackModeAtom,
  playbackSpeedAtom,
  showVisualizerAtom,
  volumeAtom,
} from '@/jotai/atom';
import { cn } from '@/utils';

const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
};

type Props = {
  handleNextTrack: () => void;
  togglePlayPause: () => void;
  togglePlaylistOpen: () => void;
  isPlaying: boolean;
  handlePreviousTrack: () => void;
  volumeRef: RefObject<HTMLDivElement | null>;
};

const ICON_SIZE = 24;

export default function PlayerControls({
  handleNextTrack,
  togglePlayPause,
  togglePlaylistOpen,
  isPlaying,
  handlePreviousTrack,
  volumeRef,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom);
  const [playbackMode, setPlaybackMode] = useAtom(playbackModeAtom);
  const { formatMessage } = useIntl();

  const togglePlaybackMode = () => {
    if (playbackMode === 'off') {
      setPlaybackMode('shuffle');
    } else if (playbackMode === 'shuffle') {
      setPlaybackMode('repeat-one');
    } else {
      setPlaybackMode('off');
    }
  };

  // Set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle clicks outside volume slider
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

  const togglePlaybackSpeed = () => {
    let nextSpeed = 1;
    if (playbackSpeed === 1) nextSpeed = 1.5;
    else if (playbackSpeed === 1.5) nextSpeed = 2;
    else nextSpeed = 1;
    setPlaybackSpeed(nextSpeed);
  };

  const renderImageButton = (
    source: string,
    alt: string,
    onClick: () => void,
    extraClass?: string,
    disabled = false
  ) => (
    <Tooltip content={alt}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700',
          extraClass
        )}
        aria-label={alt}
        title={alt}
      >
        <Image src={source} alt="" width={ICON_SIZE} height={ICON_SIZE} />
      </button>
    </Tooltip>
  );

  // Internationalized messages
  const nextTrack = formatMessage({
    id: 'player.nextTrack',
    defaultMessage: 'Next track',
  });
  const previousTrack = formatMessage({
    id: 'player.previousTrack',
    defaultMessage: 'Previous track',
  });
  const play = formatMessage({ id: 'player.play', defaultMessage: 'Play' });
  const pause = formatMessage({ id: 'player.pause', defaultMessage: 'Pause' });
  const enterFullscreen = formatMessage({
    id: 'player.enterFullscreen',
    defaultMessage: 'Enter fullscreen',
  });
  const exitFullscreen = formatMessage({
    id: 'player.exitFullscreen',
    defaultMessage: 'Exit fullscreen',
  });
  const muteVolume = formatMessage({
    id: 'player.muteVolume',
    defaultMessage: 'Mute volume',
  });
  const unmuteVolume = formatMessage({
    id: 'player.unmuteVolume',
    defaultMessage: 'Unmute volume',
  });
  const shuffleEnabled = formatMessage({
    id: 'player.shuffleEnabled',
    defaultMessage: 'Shuffle enabled',
  });
  const repeatOne = formatMessage({
    id: 'player.repeatOne',
    defaultMessage: 'Repeat one track',
  });
  const allOff = formatMessage({
    id: 'player.allOff',
    defaultMessage: 'All off',
  });

  const hideVisualizer = formatMessage({
    id: 'player.hideVisualizer',
    defaultMessage: 'Hide visualizer',
  });
  const showVisualizerText = formatMessage({
    id: 'player.showVisualizer',
    defaultMessage: 'Show visualizer',
  });
  const togglePlaylist = formatMessage({
    id: 'player.togglePlaylist',
    defaultMessage: 'Toggle playlist',
  });
  const playbackSpeedLabel = formatMessage(
    { id: 'player.playbackSpeed', defaultMessage: 'Playback speed: {speed}x' },
    { speed: playbackSpeed }
  );
  const volumeControlLabel = formatMessage({
    id: 'player.volumeControl',
    defaultMessage: 'Volume control',
  });

  // During SSR or before hydration, render a minimal placeholder that matches the non-fullscreen layout
  if (!isClient) {
    return (
      <div
        className="relative flex w-full items-center justify-between gap-2 md:gap-3"
        dir="rtl"
      >
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
      </div>
    );
  }

  // After hydration, render the actual UI
  if (isFullscreen) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        {renderImageButton(forwardSVG, nextTrack, handleNextTrack)}
        {renderImageButton(
          isPlaying ? pauseSVG : playSVG,
          isPlaying ? pause : play,
          togglePlayPause,
          isPlaying ? 'animate-slideInWithFade' : ''
        )}
        {renderImageButton(backwardSVG, previousTrack, handlePreviousTrack)}
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full items-center justify-between gap-2 md:gap-3"
      dir="rtl"
    >
      <Tooltip content={isFullscreen ? exitFullscreen : enterFullscreen}>
        <button
          onClick={toggleFullscreen}
          className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={isFullscreen ? exitFullscreen : enterFullscreen}
          title={isFullscreen ? exitFullscreen : enterFullscreen}
        >
          {isFullscreen ? (
            <BsFullscreenExit size={ICON_SIZE} color="#6b7280" />
          ) : (
            <BsFullscreen size={ICON_SIZE} color="#6b7280" />
          )}
        </button>
      </Tooltip>

      <div
        className="relative flex items-center gap-2"
        ref={volumeRef}
        style={{ touchAction: 'none' }}
      >
        <Tooltip content={volume > 0 ? muteVolume : unmuteVolume}>
          <button
            onClick={() => setShowVolumeSlider((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={volume > 0 ? muteVolume : unmuteVolume}
            title={volume > 0 ? muteVolume : unmuteVolume}
          >
            {volume > 0 ? (
              <BiVolumeFull size={ICON_SIZE} color="#6b7280" />
            ) : (
              <BiVolumeMute size={ICON_SIZE} color="#6b7280" />
            )}
          </button>
        </Tooltip>

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
              aria-label={volumeControlLabel}
            />
          </div>
        )}
      </div>

      {renderImageButton(forwardSVG, nextTrack, handleNextTrack)}
      {renderImageButton(
        isPlaying ? pauseSVG : playSVG,
        isPlaying ? pause : play,
        togglePlayPause,
        isPlaying ? 'animate-slideInWithFade' : ''
      )}
      {renderImageButton(backwardSVG, previousTrack, handlePreviousTrack)}
      <Tooltip
        content={
          playbackMode === 'off'
            ? allOff
            : playbackMode === 'shuffle'
              ? shuffleEnabled
              : repeatOne
        }
      >
        <button
          onClick={togglePlaybackMode}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700',
            playbackMode !== 'off' && 'animate-slideInWithFade'
          )}
          aria-label={
            playbackMode === 'off'
              ? allOff
              : playbackMode === 'shuffle'
                ? shuffleEnabled
                : repeatOne
          }
          title={
            playbackMode === 'off'
              ? allOff
              : playbackMode === 'shuffle'
                ? shuffleEnabled
                : repeatOne
          }
        >
          {playbackMode === 'off' ? (
            <Image
              src={shuffleDisabledSVG}
              alt=""
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : playbackMode === 'shuffle' ? (
            <Image
              src={shuffleSVG}
              alt=""
              width={ICON_SIZE}
              height={ICON_SIZE}
            />
          ) : (
            <MdRepeatOne size={ICON_SIZE} color="#3b82f6" />
          )}
        </button>
      </Tooltip>
      {renderImageButton(
        showVisualizer ? spectrumSVG : spectrumDisabledSVG,
        showVisualizer ? hideVisualizer : showVisualizerText,
        () => setShowVisualizer((v) => !v),
        isPlaying ? 'pointer-events-none cursor-not-allowed opacity-30' : '',
        isPlaying
      )}
      <Tooltip content={playbackSpeedLabel}>
        <button
          onClick={togglePlaybackSpeed}
          className="relative flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label={playbackSpeedLabel}
          title={playbackSpeedLabel}
        >
          <MdSpeed size={ICON_SIZE} color="#6b7280" />
          {playbackSpeed !== 1 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
              {playbackSpeed}
            </span>
          )}
        </button>
      </Tooltip>
      {renderImageButton(playlistSVG, togglePlaylist, togglePlaylistOpen)}
    </div>
  );
}
