import Dialog from '@components/dialog';
import React from 'react';

import { usePlayer } from '@/hooks/player/use-player';

import PlaylistContent from './playlist';

export default function Playlist(): React.ReactNode {
  const { isPlayListOpen, setIsPlayListOpen } = usePlayer();
  return (
    <Dialog isOpen={isPlayListOpen} setIsOpen={setIsPlayListOpen}>
      <PlaylistContent />
    </Dialog>
  );
}
