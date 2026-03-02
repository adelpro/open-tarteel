'use client';

import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import Range from '@/components/player/range';
import { AUDIO_PLAYER_ID } from '@/constants';
import { useRecentTracks } from '@/hooks/library/use-recent-tracks';
import { usePlayer } from '@/hooks/player/use-player';
import { usePlayerSync } from '@/hooks/player/use-player-sync';
import { useRecitersData } from '@/hooks/reciters';
import { useMediaSession } from '@/hooks/use-media-session';
import { fullscreenAtom } from '@/jotai';
import { globalAudioRef } from '@/lib/audio-ref';
import { cn, toLibraryTrack } from '@/utils';

import Playlist from '../../app/[locale]/reciter/[id]/_components/playlist';
import AudioBarsVisualizer from './audio-bars-visualizer';
import CorePlayControls from './core-play-button';
import FeaturedControls from './featured-controls';
import PlayerControls from './player-controls';
import ReciterInfo from './reciter-info';
import TrackTimeDisplay from './reciter-info/time-Display';

export default function Player() {
  usePlayerSync();
  const {
    track,
    playlist,
    trackIndex,
    duration,
    isPlaying,
    setIsPlaying,
    handleNextTrack,
    handlePreviousTrack,
    handleTimeUpdate,
    handleTrackEnded,
  } = usePlayer();

  const isFullscreen = useAtomValue(fullscreenAtom);
  const { markPlayed } = useRecentTracks();

  const { reciters } = useRecitersData();

  const reciter = useMemo(
    () => reciters.find((r) => String(r.id) === track?.reciterId),
    [reciters, track?.reciterId]
  );

  const playlistItem = useMemo(
    () => (typeof trackIndex === 'number' ? playlist[trackIndex] : undefined),
    [playlist, trackIndex]
  );

  const libraryTrack = useMemo(
    () => toLibraryTrack({ reciter, playlistItem, duration }),
    [reciter, playlistItem, duration]
  );

  const audioSource = track?.link;

  useMediaSession({
    audioRef: globalAudioRef,
    track,
    playlist,
    trackIndex,
    isPlaying,
    onPlay: () => {
      globalAudioRef.current?.play();
      setIsPlaying(true);
    },
    onPause: () => {
      globalAudioRef.current?.pause();
      setIsPlaying(false);
    },
    onNext: handleNextTrack,
    onPrev: handlePreviousTrack,
  });

  const isReady = Boolean(track && audioSource);

  if (isFullscreen) {
    return (
      <CorePlayControls className="flex items-center justify-center gap-4 py-4" />
    );
  }

  if (!isReady) return null;

  return (
    <section
      className={cn('shrink-0 border-t border-border bg-background sm:px-8')}
    >
      <div className="container relative mx-auto flex h-[var(--player-height)] flex-col gap-2 px-4 py-4 sm:px-8">
        <audio
          ref={globalAudioRef}
          id={AUDIO_PLAYER_ID}
          className="sr-only"
          onPlay={() => {
            if (libraryTrack) markPlayed(libraryTrack);
          }}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleTimeUpdate}
          onEnded={handleTrackEnded}
          crossOrigin="anonymous"
        >
          <track
            kind="captions"
            srcLang="en"
            label="English captions"
            default
          />
        </audio>

        <div className="grid flex-1 grid-cols-[1fr_minmax(0,1fr)_1fr] items-end gap-2 overflow-hidden">
          <ReciterInfo />
          <div className="min-w-0 overflow-hidden">
            <AudioBarsVisualizer />
          </div>
          <TrackTimeDisplay />
        </div>

        <Range />

        <PlayerControls />
        {/* potion abs */}
        <FeaturedControls />
        {!isFullscreen && <Playlist />}
      </div>
    </section>
  );
}
