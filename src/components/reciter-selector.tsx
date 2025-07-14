'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import React, { useState } from 'react';

import useTorrent from '@/hooks/use-torrent';
import { selectedReciterAtom, webtorrentReadyAtom } from '@/jotai/atom';
import connectionSVG from '@/svgs/connection.svg';
import connectionAnimatedSVG from '@/svgs/connection-animated.svg';
import searchSVG from '@/svgs/search.svg';

import ReciterSelectorDialog from './reciter-selector-dialog';
import TorrentInfoDialog from './torrent-info-dialog';

export default function ReciterSelector() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [torrentInfoIsOpen, setTorrentInfoIsOpen] = useState<boolean>(false);
  const webtorrentReady = useAtomValue(webtorrentReadyAtom);
  const { torrentInfo } = useTorrent();
  const selectedReciterValue = useAtomValue(selectedReciterAtom);
  const onButtonClick = () => {
    setIsOpen(true);
  };
  const connectionIcon = (): React.ReactNode => {
    if (selectedReciterValue === undefined) {
      return <></>;
    }
    return torrentInfo && torrentInfo.magnetURI ? (
      <Image
        src={connectionSVG}
        alt="connected"
        className="cursor-pointer"
        width={30}
        height={30}
        onClick={() => setTorrentInfoIsOpen(true)}
      />
    ) : (
      <Image
        src={connectionAnimatedSVG}
        alt="connecting"
        width={30}
        height={30}
        className="pointer-events-none"
      />
    );
  };
  if (!webtorrentReady) {
    return <></>;
  }
  return (
    <div className="flex w-full flex-row items-center justify-center">
      <div className="flex w-full max-w-md flex-row items-center justify-center gap-3 rounded-md border border-slate-200 p-2 shadow-md transition-transform hover:scale-105">
        {connectionIcon()}
        <button
          className="flex w-full max-w-md flex-row-reverse items-center justify-between"
          onClick={onButtonClick}
        >
          <span>
            {selectedReciterValue ? selectedReciterValue.name : 'اختر القارئ'}
          </span>

          <Image src={searchSVG} alt="search" width={30} height={30} />
        </button>
      </div>
      <ReciterSelectorDialog isOpen={isOpen} setIsOpen={setIsOpen} />
      <TorrentInfoDialog
        isOpen={torrentInfoIsOpen}
        setIsOpen={setTorrentInfoIsOpen}
      />
    </div>
  );
}
