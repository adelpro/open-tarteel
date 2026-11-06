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
import { FiHeadphones, FiRepeat } from 'react-icons/fi';
import { MdCheck, MdRepeatOne, MdSpeed } from 'react-icons/md';
import { useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { ICON_SIZE, SLEEP_MINUTES } from '@/constants';
import useDirection from '@/hooks/use-direction';
import { useSleepTimer } from '@/hooks/use-sleep-timer';
import { TimeRange, useTahfeezSession } from '@/hooks/use-tahfeez-session';
import {
  fullscreenAtom,
  playbackModeAtom,
  playbackSpeedAtom,
  selectedReciterAtom,
  showVisualizerAtom,
  volumeAtom,
} from '@/jotai/atom';
import { canUseRangeMode } from '@/services/reciters/capabilities';
import { cn } from '@/utils';

import TahfeezModeControls, { TahfeezSettings } from './tahfeez-mode-controls';
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
  audioRef: RefObject<HTMLAudioElement | null>;
  currentTrackId: number | undefined;
  tahfeezActiveRef: React.RefObject<boolean>;
  /** False when the current source has no CORS/WebAudio spectrum data. */
  spectrumSupported?: boolean;
};

export default function PlayerControls({
  handleNextTrack,
  togglePlayPause,
  togglePlaylistOpen,
  isPlaying,
  handlePreviousTrack,
  volumeRef,
  audioRef,
  currentTrackId,
  tahfeezActiveRef,
  spectrumSupported = true,
}: Props) {
  // ── State ───────────────────────────────────────────
  const [isClient, setIsClient] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom);
  const [playbackMode, setPlaybackMode] = useAtom(playbackModeAtom);
  const [activeMode, setActiveMode] = useState<'listening' | 'tahfeez'>(
    'listening'
  );
  const selectedReciter = useAtomValue(selectedReciterAtom);

  // ── Tahfeez session (engine lives in the hook) ───────
  const [tahfeezSettings, setTahfeezSettings] = useState<TahfeezSettings>({
    fromAyah: 1,
    toAyah: 5,
    repeat: 3,
    delay: 2,
    strategy: 'whole_range',
  });
  // Latest ranges emitted by TahfeezModeControls — used when the play button starts a session
  const currentRangesRef = useRef<TimeRange[]>([]);

  const session = useTahfeezSession(audioRef, (active) => {
    tahfeezActiveRef.current = active;
  });
  const { audioPlaying } = session;

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Leaving tahfeez must stop the loop; the engine keeps playing otherwise.
  const previousModeRef = useRef(activeMode);
  useEffect(() => {
    if (previousModeRef.current === 'tahfeez' && activeMode === 'listening') {
      sessionRef.current.stop();
    }
    previousModeRef.current = activeMode;
  }, [activeMode]);

  // Apply repeat/delay changes to a running session without restarting it.
  useEffect(() => {
    if (sessionRef.current.isActive()) {
      sessionRef.current.updateSettings(
        tahfeezSettings.repeat,
        tahfeezSettings.delay
      );
    }
  }, [tahfeezSettings.repeat, tahfeezSettings.delay]);

  const chapterNumber =
    currentTrackId !== undefined ? currentTrackId + 1 : undefined; // Track IDs are 0-indexed, chapters are 1-indexed

  // Update tahfeez settings when track changes
  useEffect(() => {
    if (chapterNumber) {
      setTahfeezSettings((previous) => ({
        ...previous,
        fromAyah: 1,
        toAyah: 5,
      }));
    }
  }, [chapterNumber]);

  const isTahfeezSupported = canUseRangeMode(
    selectedReciter?.source,
    selectedReciter?.moshaf
  );

  useEffect(() => {
    if (!isTahfeezSupported && activeMode === 'tahfeez') {
      setActiveMode('listening');
    }
  }, [isTahfeezSupported, activeMode]);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { formatMessage } = useIntl();
  const { isRTL } = useDirection();

  // ── Custom Hook ─────────────────────────────────────
  const { remainingTime, setSleepTimer, clearSleepTimer } =
    useSleepTimer(togglePlayPause);

  // ── Handlers with Logging ────────────────────────────
  const handleNextTrackWithStopSession = () => {
    session.stop();
    handleNextTrack();
  };

  const handlePreviousTrackWithStopSession = () => {
    session.stop();
    handlePreviousTrack();
  };

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
    tahfeezModeDisabledProvider: formatMessage({
      id: 'tahfeez.modeDisabledProvider',
      defaultMessage:
        'Tahfeez mode is only available for quran.foundation reciters',
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
    spectrumUnavailable: formatMessage({
      id: 'player.spectrumUnavailable',
      defaultMessage: 'Spectrum is not available for this reciter',
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
    cancelTimer: formatMessage({
      id: 'player.cancelTimer',
      defaultMessage: 'Cancel Timer',
    }),
    sleepTimerActive: (minutes: number) =>
      formatMessage(
        {
          id: 'player.sleepTimerActive',
          defaultMessage: 'Sleep timer: {minutes}m',
        },
        { minutes }
      ),
    tahfeezMode: formatMessage({
      id: 'tahfeez.modeLabel',
      defaultMessage: 'Tahfeez',
    }),
    listeningMode: formatMessage({
      id: 'tahfeez.listeningLabel',
      defaultMessage: 'Listening',
    }),
    modeSwitcher: formatMessage({
      id: 'player.modeSwitcher',
      defaultMessage: 'Playback mode',
    }),
  };

  // ── Render ───────────────────────────────────────────
  if (!isClient) {
    return (
      <div className="flex w-full flex-col">
        {/* Controls Skeleton */}
        <div
          className="relative flex w-full items-center justify-between gap-2 md:gap-3"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-9 w-9" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {activeMode === 'tahfeez' ? (
        <TahfeezModeControls
          tahfeezSettings={tahfeezSettings}
          setTahfeezSettings={setTahfeezSettings}
          source={selectedReciter?.source}
          moshafId={selectedReciter?.moshaf.id}
          chapterNumber={chapterNumber}
          onRangesReady={(ranges) => {
            currentRangesRef.current = ranges;
            if (session.isActive()) {
              session.updateRanges(ranges);
            } else if (
              (audioPlaying || isPlaying) &&
              activeMode === 'tahfeez'
            ) {
              session.start(
                ranges,
                tahfeezSettings.repeat,
                tahfeezSettings.delay
              );
            }
          }}
          onCleanup={() => session.stop()}
        />
      ) : null}

      <div
        className="relative flex w-full items-center justify-between gap-2 md:gap-3"
        dir={isRTL ? 'rtl' : 'ltr'}
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
        {renderImageButton(
          forwardSVG,
          messages.nextTrack,
          handleNextTrackWithStopSession
        )}
        {renderImageButton(
          audioPlaying ? pauseSVG : playSVG,
          audioPlaying ? messages.pause : messages.play,
          activeMode === 'tahfeez'
            ? () =>
                session.handlePlayPause(
                  currentRangesRef.current,
                  tahfeezSettings.repeat,
                  tahfeezSettings.delay
                )
            : togglePlayPause,
          audioPlaying ? 'animate-slideInWithFade' : ''
        )}
        {renderImageButton(
          backwardSVG,
          messages.previousTrack,
          handlePreviousTrackWithStopSession
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

        {/* Sleep timer indicator (all sizes; set from the More menu) */}
        {remainingTime !== null && remainingTime > 0 && (
          <div className="flex h-9 w-9 items-center justify-center">
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

        {/* Desktop quick actions (everything else lives in the More menu). */}
        <div className="hidden items-center gap-2 md:flex">
          <Tooltip
            content={
              isFullscreen ? messages.exitFullscreen : messages.enterFullscreen
            }
          >
            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={
                isFullscreen
                  ? messages.exitFullscreen
                  : messages.enterFullscreen
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
            playlistSVG,
            messages.togglePlaylist,
            togglePlaylistOpen
          )}
        </div>

        {/* More Menu */}
        <div className="relative" ref={moreMenuRef}>
          <Tooltip content={messages.more}>
            <button
              onClick={() => setShowMoreMenu((previous) => !previous)}
              className="relative flex h-9 w-9 items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label={messages.more}
            >
              <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                ⋯
              </span>
              {activeMode === 'tahfeez' && (
                <span
                  aria-hidden="true"
                  className="absolute end-1 top-1 size-1.5 rounded-full bg-brand-CTA-blue-500"
                />
              )}
            </button>
          </Tooltip>

          {showMoreMenu && (
            <div className="absolute bottom-10 end-0 z-10 flex w-52 flex-col gap-1 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
              <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                {messages.modeSwitcher}
              </div>
              <button
                type="button"
                aria-pressed={activeMode === 'listening'}
                onClick={() => {
                  setActiveMode('listening');
                  setShowMoreMenu(false);
                }}
                className={cn(
                  'flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
                  activeMode === 'listening' &&
                    'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                )}
              >
                <FiHeadphones size={16} aria-hidden="true" />
                <span>{messages.listeningMode}</span>
                {activeMode === 'listening' && (
                  <MdCheck size={16} className="ms-auto" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-pressed={activeMode === 'tahfeez'}
                disabled={!isTahfeezSupported}
                title={
                  isTahfeezSupported
                    ? undefined
                    : messages.tahfeezModeDisabledProvider
                }
                onClick={() => {
                  setActiveMode('tahfeez');
                  setShowMoreMenu(false);
                }}
                className={cn(
                  'flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700',
                  activeMode === 'tahfeez' &&
                    'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                )}
              >
                <FiRepeat size={16} aria-hidden="true" />
                <span>{messages.tahfeezMode}</span>
                {activeMode === 'tahfeez' && (
                  <MdCheck size={16} className="ms-auto" aria-hidden="true" />
                )}
              </button>

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

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
                aria-label={
                  !spectrumSupported
                    ? messages.spectrumUnavailable
                    : showVisualizer
                      ? messages.hideVisualizer
                      : messages.showVisualizer
                }
                title={
                  !spectrumSupported ? messages.spectrumUnavailable : undefined
                }
                onClick={() => {
                  setShowVisualizer((previous) => !previous);
                  setShowMoreMenu(false);
                }}
                disabled={isPlaying || !spectrumSupported}
                className={cn(
                  'flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
                  (isPlaying || !spectrumSupported) &&
                    'cursor-not-allowed opacity-50'
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
      </div>
    </div>
  );
}
