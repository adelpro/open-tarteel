'use client';

import React from 'react';

import RecitersList from '@/components/reciters-list';

type Props = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function ReciterSelectorDialog({ isOpen, setIsOpen }: Props) {
  return <RecitersList isOpen={isOpen} setIsOpen={setIsOpen} />;
}
