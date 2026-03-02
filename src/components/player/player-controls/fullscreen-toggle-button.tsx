import { useAtomValue } from 'jotai';

import { fullscreenAtom } from '@/jotai';
import type { ButtonConfig } from '@/types';

import {
  getButtonConfig,
  toggleFullscreen,
} from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';

export default function FullscreenToggleButton() {
  const isFullscreen = useAtomValue(fullscreenAtom);

  const id = isFullscreen ? 'player.exitFullscreen' : 'player.enterFullscreen';
  const baseConfig = getButtonConfig(id);

  const config: ButtonConfig = {
    ...baseConfig,
    onClick: toggleFullscreen,
  };

  return <ControlButton {...config} />;
}
