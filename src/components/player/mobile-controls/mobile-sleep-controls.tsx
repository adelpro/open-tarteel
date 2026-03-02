import Image from 'next/image';
import { useIntl } from 'react-intl';

import { SLEEP_MINUTES } from '@/constants';
import { getMessageConfig as t } from '@/helpers';
import { usePlayer } from '@/hooks/player/use-player';
import { useSleepTimer } from '@/hooks/use-sleep-timer';

import { getButtonConfig } from '../../../app/[locale]/reciter/[id]/_components/_helpers';

type Props = {
  closeShowMoreMenu: () => void;
};

export default function MobileSleepControls({
  closeShowMoreMenu,
}: Readonly<Props>) {
  const { formatMessage } = useIntl();
  const { togglePlayPause } = usePlayer();
  const { remainingTime, setSleepTimer, clearSleepTimer } =
    useSleepTimer(togglePlayPause);

  const sleepTimer = getButtonConfig('player.sleepTimer');
  const untilEnd = t('player.untilEnd');

  const messages = {
    sleepTimer: formatMessage({
      ...sleepTimer,
    }),
    untilEnd: formatMessage({
      ...untilEnd,
    }),
  };

  return (
    <>
      <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
        {sleepTimer.src && (
          <Image
            src={sleepTimer.src}
            alt=""
            width={12}
            height={12}
            className="me-0.5 inline"
          />
        )}
        {messages.sleepTimer}
      </div>
      <div className="flex flex-wrap gap-1">
        {SLEEP_MINUTES.map((minutes) => (
          <button
            key={minutes}
            onClick={() => {
              setSleepTimer(minutes);
              closeShowMoreMenu();
            }}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {minutes}m
          </button>
        ))}
        <button
          onClick={() => {
            setSleepTimer('end');
            closeShowMoreMenu();
          }}
          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {messages.untilEnd}
        </button>
        {remainingTime && (
          <button
            onClick={() => {
              clearSleepTimer();
              closeShowMoreMenu();
            }}
            className="w-full rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </>
  );
}
