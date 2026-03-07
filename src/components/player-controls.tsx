'use client';

import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import shuffleDisabledSVG from '@svgs/music-shuffle-disabled.svg';
import sleepSVG from '@svgs/sleep.svg';
import spectrumSVG from '@svgs/spectrum.svg';
import spectrumDisabledSVG from '@svgs/spectrum-disabled.svg';
import { useAtom, useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import { BiVolumeFull, BiVolumeMute } from 'react-icons/bi';
import { BsFullscreen, BsFullscreenExit } from 'react-icons/bs';
import { MdRepeatOne, MdSpeed } from 'react-icons/md';
import { useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { ICON_SIZE, SLEEP_MINUTES } from '@/constants';
import { useSleepTimer } from '@/hooks/use-sleep-timer';
import {
  fullscreenAtom,
  playbackModeAtom,
  playbackSpeedAtom,
  showVisualizerAtom,
  volumeAtom,
} from '@/jotai/atom';
import { cn } from '@/utils';

// ─── Helpers ─────────────────────────────────────────
const getCurrentMinute = (seconds: number): number => Math.ceil(seconds / 60);

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

export default function PlayerControls({
  handleNextTrack,
  togglePlayPause,
  togglePlaylistOpen,
  isPlaying,
  handlePreviousTrack,
  volumeRef,
}: Props) {
  // ── State ───────────────────────────────────────────
  const [isClient, setIsClient] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDesktopSleepMenu, setShowDesktopSleepMenu] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom);
  const [playbackMode, setPlaybackMode] = useAtom(playbackModeAtom);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const desktopSleepMenuRef = useRef<HTMLDivElement>(null);
  const { formatMessage } = useIntl();

  // ── Custom Hook ─────────────────────────────────────
  const { remainingTime, setSleepTimer, clearSleepTimer } =
    useSleepTimer(togglePlayPause);

  // ── Effects ──────────────────────────────────────────
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeRef.current &&
        !volumeRef.current.contains(event.target as Node)
      ) {
        setShowVolumeSlider(false);
      }
    };
    if (showVolumeSlider)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showVolumeSlider, volumeRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSleepMenuRef.current &&
        !desktopSleepMenuRef.current.contains(event.target as Node)
      ) {
        setShowDesktopSleepMenu(false);
      }
    };
    if (showDesktopSleepMenu)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDesktopSleepMenu]);

  // ── Handlers ─────────────────────────────────────────
  const togglePlaybackMode = () => {
    setPlaybackMode((previous) =>
      previous === 'off'
        ? 'shuffle'
        : previous === 'shuffle'
          ? 'repeat-one'
          : 'off'
    );
  };

  const togglePlaybackSpeed = () => {
    setPlaybackSpeed((previous) =>
      previous === 1 ? 1.5 : previous === 1.5 ? 2 : 1
    );
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
      >
        <Image src={source} alt="" width={ICON_SIZE} height={ICON_SIZE} />
      </button>
    </Tooltip>
  );

  // ── Messages ─────────────────────────────────────────
  const messages = {
    nextTrack: formatMessage({
      id: 'player.nextTrack',
      defaultMessage: 'Next track',
    }),
    previousTrack: formatMessage({
      id: 'player.previousTrack',
      defaultMessage: 'Previous track',
    }),
    play: formatMessage({ id: 'player.play', defaultMessage: 'Play' }),
    pause: formatMessage({ id: 'player.pause', defaultMessage: 'Pause' }),
    enterFullscreen: formatMessage({
      id: 'player.enterFullscreen',
      defaultMessage: 'Enter fullscreen',
    }),
    exitFullscreen: formatMessage({
      id: 'player.exitFullscreen',
      defaultMessage: 'Exit fullscreen',
    }),
    muteVolume: formatMessage({
      id: 'player.muteVolume',
      defaultMessage: 'Mute volume',
    }),
    unmuteVolume: formatMessage({
      id: 'player.unmuteVolume',
      defaultMessage: 'Unmute volume',
    }),
    shuffleEnabled: formatMessage({
      id: 'player.shuffleEnabled',
      defaultMessage: 'Shuffle enabled',
    }),
    repeatOne: formatMessage({
      id: 'player.repeatOne',
      defaultMessage: 'Repeat one track',
    }),
    allOff: formatMessage({ id: 'player.allOff', defaultMessage: 'All off' }),
    hideVisualizer: formatMessage({
      id: 'player.hideVisualizer',
      defaultMessage: 'Hide visualizer',
    }),
    showVisualizer: formatMessage({
      id: 'player.showVisualizer',
      defaultMessage: 'Show visualizer',
    }),
    togglePlaylist: formatMessage({
      id: 'player.togglePlaylist',
      defaultMessage: 'Toggle playlist',
    }),
    playbackSpeed: formatMessage(
      {
        id: 'player.playbackSpeed',
        defaultMessage: 'Playback speed: {speed}x',
      },
      { speed: playbackSpeed }
    ),
    volumeControl: formatMessage({
      id: 'player.volumeControl',
      defaultMessage: 'Volume control',
    }),
    more: formatMessage({ id: 'player.more', defaultMessage: 'More options' }),
    sleepTimer: formatMessage({
      id: 'player.sleepTimer',
      defaultMessage: 'Sleep timer',
    }),
    untilEnd: formatMessage({
      id: 'player.untilEnd',
      defaultMessage: 'Until end',
    }),
    sleepTimerActive: (minutes: number) =>
      formatMessage(
        {
          id: 'player.sleepTimerActive',
          defaultMessage: 'Sleep timer: {minutes}m',
        },
        { minutes }
      ),
  };

  // ── Render ───────────────────────────────────────────
  if (!isClient) {
    return (
      <div
        className="relative flex w-full items-center justify-between gap-2 md:gap-3"
        dir="rtl"
      >
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="h-9 w-9" />
        ))}
      </div>
    );
  }

  if (isFullscreen) {
    return (
      <div className="flex items-center justify-center gap-4 py-4">
        {renderImageButton(forwardSVG, messages.nextTrack, handleNextTrack)}
        {renderImageButton(
          isPlaying ? pauseSVG : playSVG,
          isPlaying ? messages.pause : messages.play,
          togglePlayPause,
          isPlaying ? 'animate-slideInWithFade' : ''
        )}
        {renderImageButton(
          backwardSVG,
          messages.previousTrack,
          handlePreviousTrack
        )}
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full items-center justify-between gap-2 md:gap-3"
      dir="rtl"
    >
      {/* Volume Control */}
      <div
        className="relative flex shrink-0 items-center gap-2"
        ref={volumeRef}
        style={{ touchAction: 'none' }}
      >
        <Tooltip
          content={volume > 0 ? messages.muteVolume : messages.unmuteVolume}
        >
          <button
            onClick={() => setShowVolumeSlider((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={
              volume > 0 ? messages.muteVolume : messages.unmuteVolume
            }
          >
            {volume > 0 ? (
              <BiVolumeFull size={ICON_SIZE} color="#6b7280" />
            ) : (
              <BiVolumeMute size={ICON_SIZE} color="#6b7280" />
            )}
          </button>
        </Tooltip>

        {showVolumeSlider && (
          <div className="absolute bottom-full left-1/2 mb-2 flex h-20 w-6 -translate-x-1/2 items-center justify-center">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) =>
                setVolume(Number((event.target as HTMLInputElement).value))
              }
              className="h-full w-1 cursor-pointer appearance-none bg-transparent"
              style={{
                writingMode: 'vertical-lr',
                WebkitAppearance: 'slider-vertical',
                background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${volume * 100}%, #cbd5e1 ${volume * 100}%, #cbd5e1 100%)`,
                borderRadius: '9999px',
              }}
              aria-label={messages.volumeControl}
            />
          </div>
        )}
      </div>

      {/* Core Controls */}
      {renderImageButton(forwardSVG, messages.nextTrack, handleNextTrack)}
      {renderImageButton(
        isPlaying ? pauseSVG : playSVG,
        isPlaying ? messages.pause : messages.play,
        togglePlayPause,
        isPlaying ? 'animate-slideInWithFade' : ''
      )}
      {renderImageButton(
        backwardSVG,
        messages.previousTrack,
        handlePreviousTrack
      )}

      {/* Playback Mode */}
      <Tooltip
        content={
          playbackMode === 'off'
            ? messages.allOff
            : playbackMode === 'shuffle'
              ? messages.shuffleEnabled
              : messages.repeatOne
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
              ? messages.allOff
              : playbackMode === 'shuffle'
                ? messages.shuffleEnabled
                : messages.repeatOne
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

      {/* Mobile Sleep Timer */}
      {remainingTime !== null && remainingTime > 0 && (
        <div className="flex h-9 w-9 items-center justify-center sm:hidden">
          <span className="flex items-center text-xs font-bold text-blue-500 dark:text-blue-400">
            <Image
              src={sleepSVG}
              alt=""
              width={12}
              height={12}
              className="me-0.5"
            />
            {getCurrentMinute(remainingTime)}
          </span>
        </div>
      )}

      {/* Mobile More Menu */}
      <div className="relative sm:hidden" ref={moreMenuRef}>
        <Tooltip content={messages.more}>
          <button
            onClick={() => setShowMoreMenu((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={messages.more}
          >
            <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
              ⋯
            </span>
          </button>
        </Tooltip>

        {showMoreMenu && (
          <div className="absolute bottom-10 left-0 z-10 flex w-52 flex-col gap-1 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
            <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Image
                src={sleepSVG}
                alt=""
                width={12}
                height={12}
                className="me-0.5 inline"
              />
              {messages.sleepTimer}
            </div>
            <div className="flex flex-wrap gap-1">
              {SLEEP_MINUTES.map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => {
                    setSleepTimer(minutes);
                    setShowMoreMenu(false);
                  }}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {minutes}m
                </button>
              ))}
              <button
                onClick={() => {
                  setSleepTimer('end');
                  setShowMoreMenu(false);
                }}
                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {messages.untilEnd}
              </button>
              {remainingTime && (
                <button
                  onClick={() => {
                    clearSleepTimer();
                    setShowMoreMenu(false);
                  }}
                  className="w-full rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                >
                  Cancel Timer
                </button>
              )}
            </div>

            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

            <button
              onClick={() => {
                toggleFullscreen();
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {isFullscreen ? (
                <BsFullscreenExit size={16} color="#6b7280" />
              ) : (
                <BsFullscreen size={16} color="#6b7280" />
              )}
              <span>
                {isFullscreen
                  ? messages.exitFullscreen
                  : messages.enterFullscreen}
              </span>
            </button>

            <button
              onClick={() => {
                setShowVisualizer((previous) => !previous);
                setShowMoreMenu(false);
              }}
              disabled={isPlaying}
              className={cn(
                'flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
                isPlaying && 'cursor-not-allowed opacity-50'
              )}
            >
              <Image
                src={showVisualizer ? spectrumSVG : spectrumDisabledSVG}
                alt=""
                width={16}
                height={16}
              />
              <span>
                {showVisualizer
                  ? messages.hideVisualizer
                  : messages.showVisualizer}
              </span>
            </button>

            <button
              onClick={() => {
                togglePlaybackSpeed();
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <MdSpeed size={16} color="#6b7280" />
              <span>{messages.playbackSpeed}</span>
            </button>

            <button
              onClick={() => {
                togglePlaylistOpen();
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Image src={playlistSVG} alt="" width={16} height={16} />
              <span>{messages.togglePlaylist}</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Controls */}
      <div className="hidden items-center gap-2 sm:flex">
        <Tooltip
          content={
            isFullscreen ? messages.exitFullscreen : messages.enterFullscreen
          }
        >
          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={
              isFullscreen ? messages.exitFullscreen : messages.enterFullscreen
            }
          >
            {isFullscreen ? (
              <BsFullscreenExit size={ICON_SIZE} color="#6b7280" />
            ) : (
              <BsFullscreen size={ICON_SIZE} color="#6b7280" />
            )}
          </button>
        </Tooltip>

        {renderImageButton(
          showVisualizer ? spectrumSVG : spectrumDisabledSVG,
          showVisualizer ? messages.hideVisualizer : messages.showVisualizer,
          () => setShowVisualizer((previous) => !previous),
          isPlaying ? 'pointer-events-none cursor-not-allowed opacity-30' : '',
          isPlaying
        )}

        <Tooltip content={messages.playbackSpeed}>
          <button
            onClick={togglePlaybackSpeed}
            className="relative flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={messages.playbackSpeed}
          >
            <MdSpeed size={ICON_SIZE} color="#6b7280" />
            {playbackSpeed !== 1 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                {playbackSpeed}
              </span>
            )}
          </button>
        </Tooltip>

        <div className="relative" ref={desktopSleepMenuRef}>
          <Tooltip
            content={
              remainingTime
                ? messages.sleepTimerActive(getCurrentMinute(remainingTime))
                : messages.sleepTimer
            }
          >
            <button
              onClick={() => setShowDesktopSleepMenu((previous) => !previous)}
              className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={
                remainingTime
                  ? `Sleep timer active: ${getCurrentMinute(remainingTime)} minutes remaining`
                  : messages.sleepTimer
              }
            >
              <Image src={sleepSVG} alt="" width={16} height={16} />
              {remainingTime !== null && remainingTime > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                  {getCurrentMinute(remainingTime)}
                </span>
              )}
            </button>
          </Tooltip>

          {showDesktopSleepMenu && (
            <div className="absolute bottom-10 right-0 z-10 w-40 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
              <div className="mb-1 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Image
                  src={sleepSVG}
                  alt=""
                  width={12}
                  height={12}
                  className="mr-1 inline"
                />
                {messages.sleepTimer}
              </div>
              <div className="flex flex-wrap gap-1">
                {SLEEP_MINUTES.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => {
                      setSleepTimer(minutes);
                      setShowDesktopSleepMenu(false);
                    }}
                    className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {minutes}m
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSleepTimer('end');
                    setShowDesktopSleepMenu(false);
                  }}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {messages.untilEnd}
                </button>
                {remainingTime && (
                  <button
                    onClick={() => {
                      clearSleepTimer();
                      setShowDesktopSleepMenu(false);
                    }}
                    className="w-full rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  >
                    Cancel Timer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {renderImageButton(
          playlistSVG,
          messages.togglePlaylist,
          togglePlaylistOpen
        )}
      </div>
    </div>
  );
}
