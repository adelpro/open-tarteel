import { useAtom } from 'jotai';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getButtonConfig } from '@/app/[locale]/reciter/[id]/_components/_helpers';
import { Slider } from '@/components/ui/slider';
import useDirection from '@/hooks/use-direction';
import { volumeAtom } from '@/jotai';
import { ButtonConfig } from '@/types';
import { cn } from '@/utils';

import ControlButton from '../control-button';

function getVolumeIcon(volume: number) {
  if (volume === 0) return VolumeX;
  if (volume < 50) return Volume1;
  return Volume2;
}
const DEFAULT_VOLUME = 60;
export default function VolumeControls() {
  const [volume, setVolume] = useAtom(volumeAtom);

  const [previousVolume, setPreviousVolume] = useState(DEFAULT_VOLUME);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const volumeRef = useRef<HTMLInputElement>(null);

  const { dir } = useDirection();

  const baseConfig = getButtonConfig(
    volume ? 'player.unmuteVolume' : 'player.muteVolume'
  );

  const config: ButtonConfig = {
    ...baseConfig,
    onClick: () => setShowVolumeSlider((previous) => !previous),
  };

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

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0]);
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      setPreviousVolume(volume);
      setVolume(0);
    } else {
      setVolume(previousVolume || DEFAULT_VOLUME);
    }
  }, [volume, setVolume, previousVolume]);

  const VolumeIcon = getVolumeIcon(volume);

  return (
    <div className="group flex items-center gap-1">
      <ControlButton
        {...config}
        key={config.id}
        aria-label={volume ? 'Unmute' : 'Mute'}
        onClick={toggleMute}
        icon={VolumeIcon}
      />
      <div
        className={cn(
          'w-0 overflow-hidden bg-player-stroke opacity-0 transition-all duration-300 ease-in-out',
          'group-focus-within:w-[120px] group-focus-within:opacity-100',
          'rounded-md px-1 py-2 group-hover:w-[120px] group-hover:opacity-100'
        )}
      >
        <div className="hidden items-center gap-2 pr-1 sm:flex">
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={100}
            min={0}
            step={1}
            className="flex-1"
            aria-label="Volume level"
            dir={dir}
          />
        </div>
      </div>
    </div>
  );
}
