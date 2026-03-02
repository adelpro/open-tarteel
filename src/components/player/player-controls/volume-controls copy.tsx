import { useAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { volumeAtom } from '@/jotai';
import { ButtonConfig } from '@/types';

import { getButtonConfig } from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';

export default function VolumeControls() {
  const { formatMessage } = useIntl();
  const [volume, setVolume] = useAtom(volumeAtom);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeRef = useRef<HTMLInputElement>(null);

  const volumeControl = getButtonConfig('player.volumeControl');
  const baseConfig = getButtonConfig(
    volume === 0 ? 'player.unmuteVolume' : 'player.muteVolume'
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

  return (
    <div
      ref={volumeRef}
      className="relative flex items-center gap-2"
      style={{ touchAction: 'none' }}
    >
      <ControlButton {...config} />

      {showVolumeSlider && (
        <div className="absolute bottom-full left-1/2 mb-2 flex h-24 w-6 -translate-x-1/2 items-center justify-center rounded-md bg-gray-100 p-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-full w-1 cursor-pointer appearance-none bg-transparent"
            style={{
              writingMode: 'vertical-lr',
              WebkitAppearance: 'slider-vertical',
              background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${volume * 100}%, #cbd5e1 ${volume * 100}%, #cbd5e1 100%)`,
            }}
            aria-label={formatMessage({
              ...volumeControl,
            })}
          />
        </div>
      )}
    </div>
  );
}
