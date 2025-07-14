import Dialog from '@components/dialog';
import React from 'react';

import Playlist from '@/components/playlist';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number>>;
};

export default function PlaylistDialog({
  isOpen,
  setIsOpen,
  setCurrentTrack,
}: Props): React.ReactNode {
  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <Playlist setIsOpen={setIsOpen} setCurrentTrack={setCurrentTrack} />
    </Dialog>
  );
}
