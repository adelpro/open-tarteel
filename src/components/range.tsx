import React from 'react';

import useDirection from '@/hooks/use-direction';

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
  const { isRTL } = useDirection();
  return (
    <div className="inset-0 my-3 flex h-1 w-full items-center justify-between">
      <input
        type="range"
        className="seek-thumb h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken"
        style={{
          backgroundSize: `${currentTime === 0 ? 0.001 : (currentTime / duration) * 100}% 100%`,
          backgroundPosition: isRTL ? 'right' : 'left',
          backgroundRepeat: 'no-repeat',
          backgroundImage:
            'linear-gradient(to left, var(--accent), var(--accent-line))',
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
