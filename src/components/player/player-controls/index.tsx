'use client';
import CorePlayControls from '../core-play-button';
import DeskTopControls from '../desktop-controls';
import MobileControls from '../mobile-controls';
import VolumeControls from './volume-controls';

export default function PlayerControls() {
  return (
    <div className="col-span-full grid w-full grid-cols-[1fr_auto_1fr]">
      <VolumeControls />
      <CorePlayControls className="flex" />
      <div className="">
        <DeskTopControls />
        <MobileControls />
      </div>
    </div>
  );
}
