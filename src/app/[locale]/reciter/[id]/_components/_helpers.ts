import type { BaseButtonConfig, MessageKey, PlaybackSpeed } from '@/types';

import { BUTTON_BASE_CONFIG } from './_constants';

export const PlaybackSpeedValues: PlaybackSpeed[] = [1, 1.5, 2];

export function getButtonConfig<K extends MessageKey>(
  key: K
): BaseButtonConfig {
  const config = BUTTON_BASE_CONFIG[key];

  if (!config) throw new Error(`Missing button config for key: ${key}`);

  return config;
}

export const getCurrentMinute = (seconds: number): number =>
  Math.ceil(seconds / 60);

export function getFullscreenLabel(isFullscreen: boolean, messages: any) {
  return isFullscreen ? messages.exitFullscreen : messages.enterFullscreen;
}

export function hasActiveTimer(time: number | null) {
  return time !== null && time > 0;
}
// ── Playback Speed ──────────────────────────────

export const getNextPlaybackSpeed = (
  currentSpeed: PlaybackSpeed
): PlaybackSpeed => {
  if (currentSpeed === 1) return 1.5;
  if (currentSpeed === 1.5) return 2;
  return 1;
};

export const toggleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
};
