'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { exitPlayerAtom } from '@/jotai/player';
import { globalAudioRef } from '@/lib/audio-ref';

export function usePlayerExit() {
  const exitPlayer_ = useSetAtom(exitPlayerAtom);

  const exitPlayer = useCallback(() => {
    // Stop + release media resource immediately — before atom re-render
    const audio = globalAudioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    // Clear playlist + index + isPlaying → activeTrackAtom = null → Player returns null
    exitPlayer_();
  }, [exitPlayer_]);

  return { exitPlayer };
}
