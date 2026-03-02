'use client';

import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePlayer } from '@/hooks/player/use-player';
import { fullscreenAtom, playbackSpeedAtom, showVisualizerAtom } from '@/jotai';
import type { ButtonConfig } from '@/types';

import {
  getButtonConfig,
  getNextPlaybackSpeed,
  toggleFullscreen,
} from '../../../app/[locale]/reciter/[id]/_components/_helpers';
import ControlButton from '../control-button';
import MenuItem from './menu-item';
import MobileSleepControls from './mobile-sleep-controls';
import MobileSleepTimer from './mobile-sleep-timer';

export default function MobileControls() {
  const { isPlaying } = usePlayer();

  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const [playbackSpeed, setPlaybackSpeed] = useAtom(playbackSpeedAtom);

  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

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

  // ── Handlers ─────────────────────────────────────────
  const togglePlaybackSpeed = () => {
    setPlaybackSpeed((previous) => getNextPlaybackSpeed(previous));
  };

  const closeShowMoreMenu = useCallback(() => setShowMoreMenu(false), []);

  const MoreButtonConfig: ButtonConfig = {
    ...getButtonConfig('player.more'),
    onClick: () => setShowMoreMenu((previous) => !previous),
  };
  return (
    <div className="relative flex items-center gap-2" dir="rtl">
      {/* Mobile Sleep Timer */}
      <MobileSleepTimer />

      {/* Mobile More Menu */}
      <div className="relative ms-auto sm:hidden" ref={moreMenuRef}>
        <ControlButton {...MoreButtonConfig} />
        {showMoreMenu && (
          <div className="absolute bottom-10 left-0 z-10 flex w-52 flex-col gap-1 rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
            <MobileSleepControls closeShowMoreMenu={closeShowMoreMenu} />

            <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
            <MenuItem
              {...getButtonConfig(
                isFullscreen
                  ? 'player.exitFullscreen'
                  : 'player.enterFullscreen'
              )}
              onClick={() => {
                toggleFullscreen();
                setShowMoreMenu(false);
              }}
            />
            <MenuItem
              {...getButtonConfig(
                showVisualizer
                  ? 'player.hideVisualizer'
                  : 'player.showVisualizer'
              )}
              onClick={() => {
                setShowVisualizer((previous) => !previous);
                setShowMoreMenu(false);
              }}
              disabled={isPlaying}
              extraClass={isPlaying ? 'cursor-not-allowed opacity-50' : ''}
            />
            <MenuItem
              {...getButtonConfig('player.playbackSpeed')}
              formatMessageOptions={{ speed: playbackSpeed }}
              onClick={() => {
                togglePlaybackSpeed();
                setShowMoreMenu(false);
              }}
            />
            {/* <MenuItem
              {...getButtonConfig('player.togglePlaylist')}
              onClick={() => {
                togglePlaylistOpen();
                setShowMoreMenu(false);
              }}
            /> */}
          </div>
        )}
      </div>
    </div>
  );
}
