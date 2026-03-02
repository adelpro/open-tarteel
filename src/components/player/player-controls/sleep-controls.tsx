'use client';

import sleepSVG from '@svgs/sleep.svg';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { SLEEP_MINUTES } from '@/constants';
import { getMessageConfig as t } from '@/helpers';
import { usePlayer } from '@/hooks/player/use-player';
import { useSleepTimer } from '@/hooks/use-sleep-timer';
import { ButtonConfig } from '@/types';

import {
  getButtonConfig,
  getCurrentMinute,
} from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';
import { BadgeWrapper } from './badge-wrapper';

const SLEEP_ICON_SIZE = 16;
export default function SleepControls() {
  const { togglePlayPause } = usePlayer();
  // ── State ───────────────────────────────────────────
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDesktopSleepMenu, setShowDesktopSleepMenu] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);
  const desktopSleepMenuRef = useRef<HTMLDivElement>(null);
  const { formatMessage } = useIntl();

  // ── Custom Hook ─────────────────────────────────────
  const { remainingTime, setSleepTimer, clearSleepTimer } =
    useSleepTimer(togglePlayPause);

  // ── Effects ──────────────────────────────────────────
  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSleepMenuRef.current &&
        !desktopSleepMenuRef.current.contains(event.target as Node)
      ) {
        setShowDesktopSleepMenu(false);
      }
    };
    if (showDesktopSleepMenu)
      document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDesktopSleepMenu]);

  // ── Messages ─────────────────────────────────────────
  const sleepTimer = t('player.sleepTimer');
  const untilEnd = t('player.untilEnd');

  const messages = {
    sleepTimer: formatMessage({
      ...sleepTimer,
    }),
    untilEnd: formatMessage({
      ...untilEnd,
    }),
  };

  const id = remainingTime ? 'player.sleepTimerActive' : 'player.sleepTimer';
  const baseConfig = getButtonConfig(id);

  const config: ButtonConfig = {
    ...baseConfig,
    onClick: () => setShowDesktopSleepMenu((previous) => !previous),
    formatMessageOptions: remainingTime
      ? { minutes: getCurrentMinute(remainingTime) }
      : undefined,
    iconHight: SLEEP_ICON_SIZE,
    iconWidth: SLEEP_ICON_SIZE,
  };

  return (
    <div className="relative" ref={desktopSleepMenuRef}>
      <BadgeWrapper
        show={remainingTime !== null && remainingTime > 0}
        badgeContent={
          remainingTime ? getCurrentMinute(remainingTime) : undefined
        }
      >
        <ControlButton {...config} />
      </BadgeWrapper>

      {showDesktopSleepMenu && (
        <div className="absolute bottom-10 right-0 z-10 w-40 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
          <div className="mb-1 px-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Image
              src={sleepSVG}
              alt=""
              width={12}
              height={12}
              className="mr-1 inline"
            />
            {messages.sleepTimer}
          </div>
          <div className="flex flex-wrap gap-1">
            {SLEEP_MINUTES.map((minutes) => (
              <button
                key={minutes}
                onClick={() => {
                  setSleepTimer(minutes);
                  setShowDesktopSleepMenu(false);
                }}
                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {minutes}m
              </button>
            ))}
            <button
              onClick={() => {
                setSleepTimer('end');
                setShowDesktopSleepMenu(false);
              }}
              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {messages.untilEnd}
            </button>
            {remainingTime && (
              <button
                onClick={() => {
                  clearSleepTimer();
                  setShowDesktopSleepMenu(false);
                }}
                className="w-full rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              >
                Cancel Timer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
