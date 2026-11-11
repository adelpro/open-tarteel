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
import {
  MdCheck,
  MdCloudDownload,
  MdRepeatOne,
  MdSpeed,
  MdWarning,
} from 'react-icons/md';
import { useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { ICON_SIZE, SLEEP_MINUTES } from '@/constants';
import useDirection from '@/hooks/use-direction';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useOfflineDownload } from '@/hooks/use-offline-download';
import { useSleepTimer } from '@/hooks/use-sleep-timer';
import { TimeRange, useTahfeezSession } from '@/hooks/use-tahfeez-session';
import {
  fullscreenAtom,
  lastVolumeAtom,
  playbackModeAtom,
  playbackSpeedAtom,
  selectedReciterAtom,
  showVisualizerAtom,
  visualizerModelAtom,
  volumeAtom,
} from '@/jotai/atom';
import { canUseRangeMode } from '@/services/reciters/capabilities';
import { cn } from '@/utils';

import DownloadAllButton from './download-all-button';
import TahfeezModeControls, { TahfeezSettings } from './tahfeez-mode-controls';
import ActionSheet from './ui/action-sheet';
import Segmented from './ui/segmented';
import Switch from './ui/switch';
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
  audioElement: HTMLAudioElement | null;
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
  audioElement,
  currentTrackId,
  tahfeezActiveRef,
  spectrumSupported = true,
}: Props) {
  // ── State ───────────────────────────────────────────
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [visualizerModel, setVisualizerModel] = useAtom(visualizerModelAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  // Long-press on the speaker toggles mute; a tap keeps the volume popover.
  const volumeLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const volumeLongPressFired = useRef(false);
  const [lastVolume, setLastVolume] = useAtom(lastVolumeAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom);
  const [playbackMode, setPlaybackMode] = useAtom(playbackModeAtom);
  const [activeMode, setActiveMode] = useState<'listening' | 'tahfeez'>(
    'listening'
  );
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const isOnline = useNetworkStatus();
  const {
    progress,
    lastError,
    downloadAllTracks,
    cancelDownload,
    removeAllTracks,
    isAllCached,
    getCachedCount,
    checkStorageAvailable,
    estimateStorage,
  } = useOfflineDownload();
  const downloadPlaylist = selectedReciter?.moshaf.playlist;
  const cachedCount = downloadPlaylist ? getCachedCount(downloadPlaylist) : 0;
  const allCached = downloadPlaylist ? isAllCached(downloadPlaylist) : false;

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

  const session = useTahfeezSession(audioElement, (active) => {
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

  const isTahfeezSupported =
    canUseRangeMode(selectedReciter?.source, selectedReciter?.moshaf) &&
    isOnline;

  useEffect(() => {
    if (!isTahfeezSupported && activeMode === 'tahfeez') {
      setActiveMode('listening');
    }
  }, [isTahfeezSupported, activeMode]);

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
    if (volume > 0 && volume !== lastVolume) setLastVolume(volume);
  }, [volume, lastVolume, setLastVolume]);

  useEffect(
    () => () => {
      if (volumeLongPressTimer.current) {
        clearTimeout(volumeLongPressTimer.current);
      }
    },
    []
  );

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

  // ── Handlers ─────────────────────────────────────────
  const clearVolumeLongPress = () => {
    if (volumeLongPressTimer.current) {
      clearTimeout(volumeLongPressTimer.current);
      volumeLongPressTimer.current = null;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setLastVolume(volume);
      setVolume(0);
      return;
    }
    setVolume(lastVolume > 0 ? lastVolume : 1);
  };

  const handleVolumePointerDown = () => {
    volumeLongPressFired.current = false;
    clearVolumeLongPress();
    volumeLongPressTimer.current = setTimeout(() => {
      volumeLongPressTimer.current = null;
      volumeLongPressFired.current = true;
      toggleMute();
    }, 500);
  };

  const handleVolumeClick = () => {
    // The long press already toggled mute; swallow the click that follows.
    if (volumeLongPressFired.current) {
      volumeLongPressFired.current = false;
      return;
    }
    setShowVolumeSlider((previous) => !previous);
  };

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
          'flex size-11 items-center justify-center rounded-[10px] transition-colors duration-120 hover:bg-surface-sunken',
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
    tahfeezModeDisabledOffline: formatMessage({
      id: 'tahfeez.modeDisabledOffline',
      defaultMessage: 'Tahfeez mode is unavailable while offline',
    }),
    tahfeezModeDisabledNoTimings: formatMessage({
      id: 'tahfeez.modeDisabledNoTimings',
      defaultMessage: 'This recitation has no ayah timings',
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
    volumeHint: formatMessage({
      id: 'player.volumeHint',
      defaultMessage: 'Click for volume, hold to mute or unmute',
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
    playbackSpeedLabel: formatMessage({
      id: 'player.playbackSpeedLabel',
      defaultMessage: 'Playback speed',
    }),
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
    playerSettings: formatMessage({
      id: 'player.settings',
      defaultMessage: 'Player',
    }),
    appSettings: formatMessage({ id: 'player.app', defaultMessage: 'App' }),
    offlineSection: formatMessage({
      id: 'download.offlineSection',
      defaultMessage: 'Offline',
    }),
    visualizer: formatMessage({
      id: 'player.visualizer',
      defaultMessage: 'Visualizer',
    }),
    downloadFailed: formatMessage({
      id: 'download.failedShort',
      defaultMessage: 'Download failed',
    }),
    visualizerStyle: formatMessage({
      id: 'player.visualizerStyle',
      defaultMessage: 'Spectrum style',
    }),
    bars: formatMessage({ id: 'player.bars', defaultMessage: 'Bars' }),
    peaks: formatMessage({ id: 'player.peaks', defaultMessage: 'Peaks' }),
    waves: formatMessage({ id: 'player.waves', defaultMessage: 'Waves' }),
  };

  // ── Render ───────────────────────────────────────────
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
          <Tooltip content={messages.volumeHint}>
            <button
              onClick={handleVolumeClick}
              onPointerDown={handleVolumePointerDown}
              onPointerUp={clearVolumeLongPress}
              onPointerLeave={clearVolumeLongPress}
              onPointerCancel={clearVolumeLongPress}
              onContextMenu={(event) => event.preventDefault()}
              className="flex size-11 select-none items-center justify-center rounded-[10px] transition-colors duration-120 hover:bg-surface-sunken"
              aria-label={messages.volumeControl}
            >
              {volume > 0 ? (
                <BiVolumeFull size={ICON_SIZE} className="text-ink-muted" />
              ) : (
                <BiVolumeMute size={ICON_SIZE} className="text-ink-muted" />
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
                  background: `linear-gradient(to top, var(--accent) 0%, var(--accent) ${volume * 100}%, var(--border-strong) ${volume * 100}%, var(--border-strong) 100%)`,
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
              'flex size-11 items-center justify-center rounded-[10px] transition-colors duration-120 hover:bg-surface-sunken',
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
              <MdRepeatOne size={ICON_SIZE} className="text-primary" />
            )}
          </button>
        </Tooltip>

        {/* Sleep timer indicator (all sizes; set from the More menu) */}
        {remainingTime !== null && remainingTime > 0 && (
          <div className="flex h-9 w-9 items-center justify-center">
            <span className="flex items-center text-xs font-bold text-primary">
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
        <div className="hidden items-center gap-1 md:flex">
          <Tooltip
            content={
              isFullscreen ? messages.exitFullscreen : messages.enterFullscreen
            }
          >
            <button
              onClick={toggleFullscreen}
              className="flex size-11 items-center justify-center rounded-[10px] transition-colors duration-120 hover:bg-surface-sunken"
              aria-label={
                isFullscreen
                  ? messages.exitFullscreen
                  : messages.enterFullscreen
              }
            >
              {isFullscreen ? (
                <BsFullscreenExit size={ICON_SIZE} className="text-ink-muted" />
              ) : (
                <BsFullscreen size={ICON_SIZE} className="text-ink-muted" />
              )}
            </button>
          </Tooltip>

          {renderImageButton(
            playlistSVG,
            messages.togglePlaylist,
            togglePlaylistOpen
          )}
        </div>

        {/* More menu */}
        <Tooltip content={messages.more}>
          <button
            onClick={() => setShowMoreMenu(true)}
            className="relative flex size-11 items-center justify-center rounded-[10px] text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
            aria-label={messages.more}
          >
            <span className="text-lg font-bold">⋯</span>
            {activeMode === 'tahfeez' ? (
              <span
                aria-hidden="true"
                className="absolute end-2 top-2 size-1.5 rounded-full bg-primary"
              />
            ) : null}
          </button>
        </Tooltip>
      </div>

      <ActionSheet
        open={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title={messages.more}
      >
        <MenuGroup label={messages.modeSwitcher}>
          <MenuRow
            icon={<FiHeadphones size={18} aria-hidden="true" />}
            label={messages.listeningMode}
            pressed={activeMode === 'listening'}
            onClick={() => {
              setActiveMode('listening');
              setShowMoreMenu(false);
            }}
          />
          <MenuRow
            icon={<FiRepeat size={18} aria-hidden="true" />}
            label={messages.tahfeezMode}
            pressed={activeMode === 'tahfeez'}
            disabled={!isTahfeezSupported}
            title={
              isTahfeezSupported
                ? undefined
                : !isOnline
                  ? messages.tahfeezModeDisabledOffline
                  : selectedReciter?.moshaf.hasTimings === false
                    ? messages.tahfeezModeDisabledNoTimings
                    : messages.tahfeezModeDisabledProvider
            }
            onClick={() => {
              setActiveMode('tahfeez');
              setShowMoreMenu(false);
            }}
          />
        </MenuGroup>

        <MenuGroup label={messages.sleepTimer}>
          <div className="flex flex-wrap gap-1.5 px-2 pb-2">
            {SLEEP_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => {
                  setSleepTimer(minutes);
                  setShowMoreMenu(false);
                }}
                className="h-9 rounded-[8px] border border-border bg-surface px-3 text-[12px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
              >
                {minutes}m
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSleepTimer('end');
                setShowMoreMenu(false);
              }}
              className="h-9 rounded-[8px] border border-border bg-surface px-3 text-[12px] font-bold text-ink transition-colors duration-120 hover:bg-surface-sunken"
            >
              {messages.untilEnd}
            </button>
            {remainingTime ? (
              <button
                type="button"
                onClick={() => {
                  clearSleepTimer();
                  setShowMoreMenu(false);
                }}
                className="h-9 rounded-[8px] px-3 text-[12px] font-bold text-danger transition-colors duration-120 hover:bg-surface-sunken"
              >
                {messages.cancelTimer}
              </button>
            ) : null}
          </div>
        </MenuGroup>

        <MenuGroup label={messages.playerSettings}>
          <div className="flex min-h-12 items-center gap-3 rounded-[8px] px-2">
            <span className="flex size-5 shrink-0 items-center justify-center text-ink-muted">
              <Image
                src={showVisualizer ? spectrumSVG : spectrumDisabledSVG}
                alt=""
                width={18}
                height={18}
              />
            </span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
              {messages.visualizer}
            </span>
            <Switch
              checked={showVisualizer}
              onCheckedChange={setShowVisualizer}
              disabled={isPlaying || !spectrumSupported}
              label={messages.visualizer}
            />
          </div>
          {showVisualizer && spectrumSupported ? (
            <div className="px-2 pb-2">
              <Segmented
                value={visualizerModel}
                onChange={setVisualizerModel}
                label={messages.visualizerStyle}
                options={[
                  { value: 'bars', label: messages.bars },
                  { value: 'peaks', label: messages.peaks },
                  { value: 'ribbon', label: messages.waves },
                ]}
              />
            </div>
          ) : null}
          <MenuRow
            icon={<MdSpeed size={18} aria-hidden="true" />}
            label={messages.playbackSpeedLabel}
            onClick={() => togglePlaybackSpeed()}
            trailing={
              <span className="text-[12px] font-bold tabular-nums text-ink-muted">
                {playbackSpeed}×
              </span>
            }
          />
        </MenuGroup>

        {downloadPlaylist && downloadPlaylist.length > 0 ? (
          <MenuGroup label={messages.offlineSection}>
            <div className="px-2 pb-2">
              <DownloadAllButton
                playlist={downloadPlaylist}
                cachedCount={cachedCount}
                isAllCached={allCached}
                isOnline={isOnline}
                progress={progress}
                error={lastError}
                onDownloadAll={downloadAllTracks}
                onRemoveAll={removeAllTracks}
                onCancel={cancelDownload}
                checkStorageAvailable={checkStorageAvailable}
                estimateStorage={estimateStorage}
              />
            </div>
          </MenuGroup>
        ) : null}

        <div className="md:hidden">
          <MenuGroup label={messages.appSettings}>
            <MenuRow
              icon={
                isFullscreen ? (
                  <BsFullscreenExit size={18} aria-hidden="true" />
                ) : (
                  <BsFullscreen size={18} aria-hidden="true" />
                )
              }
              label={
                isFullscreen
                  ? messages.exitFullscreen
                  : messages.enterFullscreen
              }
              onClick={() => {
                toggleFullscreen();
                setShowMoreMenu(false);
              }}
            />
            <MenuRow
              icon={<Image src={playlistSVG} alt="" width={18} height={18} />}
              label={messages.togglePlaylist}
              onClick={() => {
                togglePlaylistOpen();
                setShowMoreMenu(false);
              }}
            />
          </MenuGroup>
        </div>
      </ActionSheet>

      {progress || lastError ? (
        <button
          type="button"
          onClick={() => setShowMoreMenu(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-1/2 z-40 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface px-3.5 text-[12px] font-bold text-ink shadow-md md:bottom-6"
        >
          {progress ? (
            <MdCloudDownload
              className="size-4 text-primary"
              aria-hidden="true"
            />
          ) : (
            <MdWarning className="size-4 text-danger" aria-hidden="true" />
          )}
          <span className="tabular-nums">
            {progress
              ? formatMessage(
                  {
                    id: 'download.downloadingShort',
                    defaultMessage: 'Downloading {completed}/{total}',
                  },
                  {
                    completed: progress.completed,
                    total: progress.total,
                  }
                )
              : messages.downloadFailed}
          </span>
          {progress ? (
            <span className="tabular-nums text-ink-muted">
              {Math.round((progress.completed / progress.total) * 100)}%
            </span>
          ) : null}
        </button>
      ) : null}
    </div>
  );
}

function MenuGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-1 last:border-b-0">
      <h3 className="px-2 pb-1 pt-2 text-[12px] font-bold text-ink-muted">
        {label}
      </h3>
      {children}
    </section>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
  disabled = false,
  pressed,
  trailing,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  trailing?: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={pressed}
      className="flex min-h-12 w-full items-center gap-3 rounded-[8px] px-2 text-start text-[14px] text-ink transition-colors duration-120 hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex size-5 shrink-0 items-center justify-center text-ink-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {pressed ? (
        <MdCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        trailing
      )}
    </button>
  );
}
