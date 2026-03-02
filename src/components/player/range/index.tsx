'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import { useAtomValue } from 'jotai';
import * as React from 'react';

import { usePlayer } from '@/hooks/player/use-player';
import useDirection from '@/hooks/use-direction';
import { libraryTracksAtom } from '@/jotai/library-atoms';
import { activeTrackAtom } from '@/jotai/player';
import { globalAudioRef } from '@/lib/audio-ref';

import { ProgressTrackLayers } from './range';

// ─────────── Slider Wrapper ───────────
export default function RangeSlider() {
  const { duration, currentTime, setCurrentTime } = usePlayer();
  const { isRTL } = useDirection();

  const activeTrack = useAtomValue(activeTrackAtom);
  const libraryTracks = useAtomValue(libraryTracksAtom);

  const [bufferedPct, setBufferedPct] = React.useState(0);
  const rafRef = React.useRef<number>(0);

  // ── Buffered percent
  React.useEffect(() => {
    function updateBuffered() {
      const audio = globalAudioRef.current;
      if (!audio?.duration || audio.duration === 0) {
        setBufferedPct(0);
        return;
      }
      try {
        const buffered = audio.buffered;
        if (buffered.length === 0) {
          setBufferedPct(0);
          return;
        }
        const end = buffered.end(buffered.length - 1);
        setBufferedPct((end / audio.duration) * 100);
      } catch {
        setBufferedPct(0);
      }
    }

    const audio = globalAudioRef.current;
    if (!audio) return;

    const onProgress = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateBuffered);
    };

    audio.addEventListener('progress', onProgress);
    audio.addEventListener('timeupdate', onProgress);
    return () => {
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('timeupdate', onProgress);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Downloaded percent (library track)
  const libraryTrack = activeTrack
    ? libraryTracks.find((t) => t.id === activeTrack.id)
    : null;

  const downloadedPct =
    libraryTrack?.totalBytes && libraryTrack.totalBytes > 0
      ? Math.min(
          100,
          (libraryTrack.downloadedBytes / libraryTrack.totalBytes) * 100
        )
      : 0;

  const currentPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (value: number[]) => {
    const time = value[0];
    setCurrentTime(time);
    if (globalAudioRef.current) globalAudioRef.current.currentTime = time;
  };

  return (
    <div className="col-span-full my-4 flex w-full flex-col gap-1">
      <SliderPrimitive.Root
        value={[currentTime]}
        min={0}
        max={duration || 1}
        step={0.1}
        onValueChange={handleSeek}
        className="relative flex w-full touch-none select-none items-center"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <ProgressTrackLayers
          bufferedPct={bufferedPct}
          downloadedPct={downloadedPct}
          currentPct={currentPct}
        />
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary bg-white shadow-sm hover:ring-4 focus:ring-4" />
      </SliderPrimitive.Root>
    </div>
  );
}
