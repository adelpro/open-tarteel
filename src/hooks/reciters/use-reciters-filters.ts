'use client';

import { useAtom } from 'jotai';
import { useState } from 'react';

import { recitersSortAtom, selectedRiwayaAtom } from '@/jotai';
import { showRecentOnlyAtom } from '@/jotai/atoms';

export function useRecitersFilter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiwaya, setSelectedRiwaya] = useAtom(selectedRiwayaAtom);
  const [showRecentOnly, setShowRecentOnly] = useAtom(showRecentOnlyAtom);
  const [sortMode, setSortMode] = useAtom(recitersSortAtom);

  return {
    searchTerm,
    setSearchTerm,
    selectedRiwaya,
    setSelectedRiwaya,
    sortMode,
    setSortMode,

    showRecentOnly,
    setShowRecentOnly,
  };
}
