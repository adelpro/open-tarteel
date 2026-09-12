'use client';

import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';

import Player from '@/components/player';
import { selectedReciterAtom } from '@/jotai/atom';

export default function OfflinePlayer() {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !selectedReciter?.moshaf?.playlist) return null;

  const playlist = selectedReciter.moshaf.playlist;

  return (
    <div className="mt-6 flex w-full max-w-xl flex-col items-center gap-3">
      <p className="text-lg font-bold text-foreground">
        {selectedReciter.name}
      </p>
      <Player playlist={playlist} />
    </div>
  );
}
