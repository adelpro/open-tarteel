import backwardSVG from '@svgs/music-backward.svg';
import forwardSVG from '@svgs/music-forward.svg';
import pauseSVG from '@svgs/music-pause.svg';
import playSVG from '@svgs/music-play.svg';
import playlistSVG from '@svgs/music-playlist.svg';
import repeatSVG from '@svgs/music-repeat.svg';
import shuffleSVG from '@svgs/music-shuffle.svg';
import { useAtom } from 'jotai';
import Image from 'next/image';
import React, { RefObject, useState } from 'react';
import { BiVolumeFull, BiVolumeMute } from 'react-icons/bi';
import { TbAntennaBars5, TbAntennaBarsOff } from 'react-icons/tb';

import { showVisualizerAtom } from '@/jotai/atom';

type Props = {
  handleNextTrack: () => void;
  togglePlayPause: () => void;
  isPlaying: boolean;
  handlePreviousTrack: () => void;
  volumeRef: RefObject<HTMLDivElement | null>;
};

export default function PlayerControls({
  handleNextTrack,
  togglePlayPause,
  isPlaying,
  handlePreviousTrack,
  volumeRef,
}: Props) {
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [showVisualizer, setShowVisualizer] = useAtom(showVisualizerAtom);
  const [isOpen, setIsOpen] = useState(false);

  function toggleShuffle() {
    setIsShuffled((v) => !v);
  }

  return (
    <div className="relative flex w-full items-center justify-between gap-2 pt-5 md:gap-4">
      {/* Volume control */}
      <div className="relative flex items-center" ref={volumeRef}>
        <button
          onClick={() => setShowVolumeSlider((v) => !v)}
          className="rounded p-2 hover:bg-gray-200"
          aria-label="Volume control"
        >
          {volume === 0 ? (
            <BiVolumeMute size={24} />
          ) : (
            <BiVolumeFull size={24} />
          )}
        </button>

        {showVolumeSlider && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="absolute bottom-12 left-1/2 h-24 w-1.5 -translate-x-1/2 cursor-pointer appearance-none bg-slate-300 rtl:rotate-180"
            style={{
              writingMode: 'vertical-lr',
              WebkitAppearance: 'slider-vertical',
            }}
          />
        )}
      </div>

      <button
        onClick={handleNextTrack}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Next track"
      >
        <Image src={forwardSVG} alt="next" width={30} height={30} />
      </button>

      <button
        onClick={togglePlayPause}
        className="rounded p-2 hover:bg-gray-200"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <Image
          src={isPlaying ? pauseSVG : playSVG}
          alt="play-pause"
          width={30}
          height={30}
        />
      </button>

      <button
        onClick={handlePreviousTrack}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Previous track"
      >
        <Image src={backwardSVG} alt="previous" width={30} height={30} />
      </button>

      <button
        onClick={toggleShuffle}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Shuffle"
      >
        <Image
          src={isShuffled ? shuffleSVG : repeatSVG}
          alt="shuffle/repeat"
          width={30}
          height={30}
        />
      </button>

      <button
        onClick={() => setShowVisualizer((v) => !v)}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Toggle Visualizer"
      >
        {showVisualizer ? (
          <TbAntennaBars5 size={24} />
        ) : (
          <TbAntennaBarsOff size={24} />
        )}
      </button>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded p-2 hover:bg-gray-200"
        aria-label="Playlist"
      >
        <Image src={playlistSVG} alt="playlist" width={30} height={30} />
      </button>
    </div>
  );
}
