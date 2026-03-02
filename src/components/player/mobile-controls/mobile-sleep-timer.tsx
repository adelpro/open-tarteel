import Image from 'next/image';

import { usePlayer } from '@/hooks/player/use-player';
import { useSleepTimer } from '@/hooks/use-sleep-timer';

import {
  getButtonConfig,
  getCurrentMinute,
} from '../../../app/[locale]/reciter/[id]/_components/_helpers';

export default function MobileSleepTimer() {
  const { togglePlayPause } = usePlayer();
  const { remainingTime } = useSleepTimer(togglePlayPause);
  const config = getButtonConfig('player.sleepTimer');
  if (remainingTime !== null && remainingTime > 0)
    return (
      <div className="flex h-9 w-9 items-center justify-center sm:hidden">
        <span className="flex items-center text-xs font-bold text-blue-500 dark:text-blue-400">
          {config.src && (
            <Image
              src={config.src}
              alt={config.id}
              width={12}
              height={12}
              className="me-0.5"
            />
          )}
          {getCurrentMinute(remainingTime)}
        </span>
      </div>
    );
}
