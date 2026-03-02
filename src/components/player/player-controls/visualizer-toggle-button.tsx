import { useAtom } from 'jotai';

import { getButtonConfig } from '@/app/[locale]/reciter/[id]/_components/_helpers';
import { usePlayer } from '@/hooks/player/use-player';
import { showVisualizerAtom } from '@/jotai';
import type { ButtonConfig } from '@/types';

import ControlButton from '../control-button';

export default function VisualizerToggleButton() {
  const { isPlaying } = usePlayer();

  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);

  const id = showVisualizer ? 'player.hideVisualizer' : 'player.showVisualizer';
  const baseConfig = getButtonConfig(id);

  const config: ButtonConfig = {
    ...baseConfig,
    onClick: () => setShowVisualizer((previous) => !previous),
    disabled: isPlaying,
    // Hidden on mobile
    extraClass: 'hidden md:flex',
  };

  return <ControlButton {...config} />;
}
