import { usePlayer } from '@/hooks/player/use-player';
import type { ButtonConfig } from '@/types';

import { getButtonConfig } from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';

export default function PlayButton() {
  const { isPlaying, togglePlayPause } = usePlayer();

  const id = isPlaying ? 'player.pause' : 'player.play';

  const baseConfig = getButtonConfig(id);

  const config: ButtonConfig = {
    ...baseConfig,
    onClick: togglePlayPause,
  };

  return <ControlButton {...config} />;
}
