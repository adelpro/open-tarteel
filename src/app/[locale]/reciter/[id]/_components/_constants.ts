import archiveAddSVG from '@svgs/archive-add.svg';
import archiveSlashSVG from '@svgs/archive-slash.svg';
import dotsHorizontalSVG from '@svgs/dots-horizontal.svg';
import errorSVG from '@svgs/error.svg';
import fullscreen from '@svgs/fullscreen.svg';
import fullscreenExit from '@svgs/fullscreen-exit.svg';
import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import shuffleDisabledSVG from '@svgs/music-shuffle-disabled.svg';
import repeatOneSVG from '@svgs/repeat-one.svg';
import sandWatchSVG from '@svgs/sand-watch.svg';
import sleepSVG from '@svgs/sleep.svg';
import spectrumSVG from '@svgs/spectrum.svg';
import spectrumDisabledSVG from '@svgs/spectrum-disabled.svg';
import speedMeterSVG from '@svgs/speed-meter.svg';
import stopSVG from '@svgs/stop.svg';

import { getMessageConfig as t } from '@/helpers';
import type { ButtonConfigMap } from '@/types';

const volumeControl = t('player.volumeControl');
const muteVolume = t('player.muteVolume');
const unmuteVolume = t('player.unmuteVolume');

const enterFullscreen = t('player.enterFullscreen');
const exitFullscreen = t('player.exitFullscreen');

const previousTrack = t('player.previousTrack');

const play = t('player.play');
const pause = t('player.pause');

const nextTrack = t('player.nextTrack');

const togglePlaylist = t('player.togglePlaylist');

const allOff = t('player.allOff');
const shuffleEnabled = t('player.shuffleEnabled');
const repeatOne = t('player.repeatOne');

const playbackSpeed = t('player.playbackSpeed');

const sleepTimer = t('player.sleepTimer');
const sleepTimerActive = t('player.sleepTimerActive');

const showVisualizer = t('player.showVisualizer');
const hideVisualizer = t('player.hideVisualizer');

const saveTrack = t('player.saveTrack');
const queuedForDownload = t('player.queuedForDownload');
const downloading = t('player.downloading');
const removeFromLibrary = t('player.removeFromLibrary');
const pausedClickToResume = t('player.pausedClickToResume');
const downloadFailedRetry = t('player.downloadFailedRetry');

const more = t('player.more');

export const BUTTON_BASE_CONFIG: ButtonConfigMap = {
  // Volume control Button
  [volumeControl.id]: {
    ...volumeControl,
    // src: UnMuteVolumeSVG,
  },
  [unmuteVolume.id]: {
    ...unmuteVolume,
    // src: MuteVolumeSVG,
  },
  [muteVolume.id]: {
    ...muteVolume,
    // src: UnMuteVolumeSVG,
  },

  // Fullscreen toggle Button
  [enterFullscreen.id]: {
    ...enterFullscreen,
    src: fullscreen,
  },
  [exitFullscreen.id]: {
    ...exitFullscreen,
    src: fullscreenExit,
  },

  // Previous Track Button
  [previousTrack.id]: {
    ...previousTrack,
    src: backwardSVG,
  },

  // Play & Pause Button
  [play.id]: {
    ...play,
    src: playSVG,
  },
  [pause.id]: {
    ...pause,
    src: pauseSVG,
  },

  // Next Track Button
  [nextTrack.id]: {
    ...nextTrack,
    src: forwardSVG,
  },

  // PlayMode Button
  [allOff.id]: {
    ...allOff,
    src: shuffleDisabledSVG,
  },
  [shuffleEnabled.id]: {
    ...shuffleEnabled,
    src: shuffleSVG,
  },
  [repeatOne.id]: {
    ...repeatOne,
    src: repeatOneSVG,
  },

  // playback Speed Button
  [playbackSpeed.id]: {
    ...playbackSpeed,
    src: speedMeterSVG,
  },

  // sleep Timer Button
  [sleepTimer.id]: {
    ...sleepTimer,
    src: sleepSVG,
  },
  [sleepTimerActive.id]: {
    ...sleepTimerActive,
    src: sleepSVG,
  },

  // Visualizer toggle Button
  [showVisualizer.id]: {
    ...showVisualizer,
    src: spectrumDisabledSVG,
  },
  [hideVisualizer.id]: {
    ...hideVisualizer,
    src: spectrumSVG,
  },

  // PlayList Button
  [togglePlaylist.id]: {
    ...togglePlaylist,
    src: playlistSVG,
  },

  // Library Buttons
  [saveTrack.id]: {
    ...saveTrack,
    src: archiveAddSVG,
  },
  [queuedForDownload.id]: {
    src: sandWatchSVG,
    ...queuedForDownload,
  },
  [downloading.id]: {
    src: sandWatchSVG,
    ...downloading,
  },
  [removeFromLibrary.id]: {
    src: archiveSlashSVG,
    ...removeFromLibrary,
  },
  [pausedClickToResume.id]: {
    src: stopSVG,
    ...pausedClickToResume,
  },
  [downloadFailedRetry.id]: {
    src: errorSVG,
    ...downloadFailedRetry,
  },

  // More List Button
  [more.id]: {
    ...more,
    src: dotsHorizontalSVG,
  },
} as const;
