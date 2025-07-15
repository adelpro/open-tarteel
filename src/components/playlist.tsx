import { useAtomValue } from 'jotai';
import React from 'react';

import { SURAHS } from '@/constants';
import { selectedReciterAtom } from '@/jotai/atom';
import { PlaylistItem } from '@/types';

type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export default function Playlist({ setIsOpen, setCurrentTrack }: Props) {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const handlePlylistItemClick = (index: number) => {
    setIsOpen(false);
    setCurrentTrack(index);
  };

  if (!selectedReciter?.moshaf?.playlist) {
    return <></>;
  }

  return (
    <main>
      <h1 className="my-2 w-full text-center">القائمة</h1>
      <ul className="my-2 w-full pl-3 text-right">
        <ul className="my-2 w-full pl-3 text-right">
          {selectedReciter?.moshaf?.playlist.map(
            (element: PlaylistItem, index: number) => (
              <li
                key={index}
                className="mx-2 my-3 w-full cursor-pointer rounded p-2 text-slate-500 transition-colors duration-300 hover:bg-gray-200 hover:text-slate-800"
                onClick={() => handlePlylistItemClick(index)}
              >
                {SURAHS.find((s) => s.id.toString() === element.surahId)?.name}
              </li>
            )
          )}
        </ul>
      </ul>
    </main>
  );
}
