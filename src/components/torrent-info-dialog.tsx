import Dialog from '@components/dialog';
import React from 'react';

import TorrentInfo from './torrent-info';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function TorrentInfoDialog({ isOpen, setIsOpen }: Props) {
  return (
    <Dialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      hideCloseButton
      className="max-w-2xl"
    >
      <TorrentInfo setIsOpen={setIsOpen} />
    </Dialog>
  );
}
