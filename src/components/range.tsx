import React from 'react';

type Props = {
  currentTime: number;
  duration: number;
  setCurrentTime: (time: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
};
export default function Range({
  currentTime,
  duration,
  setCurrentTime,
  audioRef,
}: Props) {
  return (
    <div className="inset-0 flex h-1 w-full items-center justify-between">
      <input
        type="range"
        className="square-thumb h-1 w-full bg-gray-200 bg-gradient-to-r from-blue-600 to-blue-200 bg-no-repeat accent-blue-600 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded [&::-moz-range-thumb]:transition-colors [&::-moz-range-thumb]:duration-200 [&::-moz-range-thumb]:hover:bg-gray-300 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded [&::-webkit-slider-thumb]:transition-colors [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:bg-gray-300"
        style={{
          backgroundSize: `${(currentTime / duration) * 100}% 100%`,
        }}
        min={0}
        max={duration}
        value={currentTime}
        onChange={(event) => {
          if (audioRef.current) {
            const time = Number.parseFloat(event.target.value);
            setCurrentTime(time);
            audioRef.current.currentTime = time;
          }
        }}
      />
    </div>
  );
}
