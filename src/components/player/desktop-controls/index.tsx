'use client';

import FullscreenToggleButton from '../player-controls/fullscreen-toggle-button';
import PlaybackModeButton from '../player-controls/playback-mode-button';
import PlaybackSpeedButton from '../player-controls/playback-speed-button';
import SleepControls from '../player-controls/sleep-controls';
import VisualizerToggleButton from '../player-controls/visualizer-toggle-button';

export default function DeskTopControls() {
  return (
    <div className="hidden items-center justify-end gap-1 sm:flex">
      <VisualizerToggleButton />
      <SleepControls />
      <PlaybackSpeedButton />

      <PlaybackModeButton />
      <FullscreenToggleButton />
    </div>
  );
}
