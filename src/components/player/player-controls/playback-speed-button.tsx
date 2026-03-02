import { useAtom } from 'jotai';

import { playbackSpeedAtom } from '@/jotai';
import type { ButtonConfig } from '@/types';

import {
  getButtonConfig,
  getNextPlaybackSpeed,
} from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';
import { BadgeWrapper } from './badge-wrapper';

export default function PlaybackSpeedButton() {
  const [speed, setSpeed] = useAtom(playbackSpeedAtom);

  const togglePlaybackSpeed = () =>
    setSpeed((previous) => getNextPlaybackSpeed(previous));

  const config: ButtonConfig = {
    ...getButtonConfig('player.playbackSpeed'),
    formatMessageOptions: { speed },
    onClick: togglePlaybackSpeed,
    extraClass: 'text-[6b7280]',
  };

  return (
    <BadgeWrapper show={speed !== 1} badgeContent={speed}>
      <ControlButton {...config} />
    </BadgeWrapper>
  );
}
