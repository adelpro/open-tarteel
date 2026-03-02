import { useAtom } from 'jotai';

import { playbackModeAtom } from '@/jotai';
import type { ButtonConfig } from '@/types';

import { getButtonConfig } from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';

// ── Playback Mode ───────────────────────────────
export type PlaybackMode = 'off' | 'shuffle' | 'repeat-one';

export enum PlaybackModeEnum {
  OFF = 'off',
  SHUFFLE = 'shuffle',
  REPEAT_ONE = 'repeat-one',
}

// ── Functions ──────────────────────────────────
export const getNextPlaybackMode = (
  currentMode: PlaybackMode
): PlaybackMode => {
  if (currentMode === PlaybackModeEnum.OFF) return PlaybackModeEnum.SHUFFLE;
  if (currentMode === PlaybackModeEnum.SHUFFLE)
    return PlaybackModeEnum.REPEAT_ONE;
  return PlaybackModeEnum.OFF;
};

export default function PlaybackModeButton() {
  const [playbackMode, setPlaybackMode] = useAtom(playbackModeAtom);

  const togglePlaybackMode = () =>
    setPlaybackMode((previous) => getNextPlaybackMode(previous));

  const configMap: Record<PlaybackMode, ButtonConfig> = {
    [PlaybackModeEnum.OFF]: {
      ...getButtonConfig('player.allOff'),
      onClick: togglePlaybackMode,
    },
    [PlaybackModeEnum.SHUFFLE]: {
      ...getButtonConfig('player.shuffleEnabled'),
      onClick: togglePlaybackMode,
      extraClass: 'animate-slideInWithFade',
    },
    [PlaybackModeEnum.REPEAT_ONE]: {
      ...getButtonConfig('player.repeatOne'),
      onClick: togglePlaybackMode,
      extraClass: 'animate-slideInWithFade',
    },
  };

  const config = configMap[playbackMode] || configMap[PlaybackModeEnum.OFF];

  return <ControlButton {...config} />;
}
