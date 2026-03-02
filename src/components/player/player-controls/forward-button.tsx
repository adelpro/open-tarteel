import { usePlayer } from '@/hooks/player/use-player';
import type { ButtonConfig } from '@/types';

import { getButtonConfig } from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';

export default function ForwardButton() {
  const { handleNextTrack } = usePlayer();

  const config: ButtonConfig = {
    ...getButtonConfig('player.nextTrack'),
    onClick: handleNextTrack,
  };

  return <ControlButton {...config} />;
}
