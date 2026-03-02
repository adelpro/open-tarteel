import { X } from 'lucide-react';

import { getMessageConfig } from '@/helpers';
import { usePlayerExit } from '@/hooks/player/use-player-exit';

import ControlButton from '../control-button';

export default function CLoseButton() {
  const { exitPlayer } = usePlayerExit();

  return (
    <ControlButton
      {...getMessageConfig('close')}
      extraClass="size-6 text-player-stroke"
      icon={X}
      onClick={exitPlayer}
    />
  );
}
