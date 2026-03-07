import Dialog from '@components/dialog';
import React from 'react';

import RecitersList from '@/components/reciters-list';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ReciterSelectorDialog({ isOpen, setIsOpen }: Props) {
  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen} className="bg-transparent">
      <RecitersList setIsOpen={setIsOpen} />
    </Dialog>
  );
}
