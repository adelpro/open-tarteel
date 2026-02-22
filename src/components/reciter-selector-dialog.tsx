'use client';

import Dialog from '@components/dialog';
import React from 'react';
import { useIntl } from 'react-intl';

import RecitersList from '@/components/reciters-list';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ReciterSelectorDialog({ isOpen, setIsOpen }: Props) {
  const { formatMessage } = useIntl();

  const dialogLabel = formatMessage({
    id: 'reciterDialog.title',
    defaultMessage: 'Select a Reciter',
  });
  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen} ariaLabel={dialogLabel}>
      <RecitersList setIsOpen={setIsOpen} />
    </Dialog>
  );
}
