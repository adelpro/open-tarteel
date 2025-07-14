import React from 'react';

import { PLAYLIST, SURAHS } from '@/constants';
type Props = {
  setIsOpen: (isOpen: boolean) => void;
  setCurrentTrack: React.Dispatch<React.SetStateAction<number>>;
};

export default function Playlist({ setIsOpen, setCurrentTrack }: Props) {
  const handlePlylistItemClick = (index: number) => {
    setIsOpen(false);
    setCurrentTrack(index);
  };

  return (
    <main>
      <h1 className="my-2 w-full text-center">القائمة</h1>
      <ul className="my-2 w-full pl-3 text-right">
        {PLAYLIST.map((element, index) => (
          <li
            key={index}
            className="mx-2 my-3 w-full cursor-pointer rounded p-2 text-slate-500 transition-colors duration-300 hover:bg-gray-200 hover:text-slate-800"
            onClick={() => handlePlylistItemClick(index)}
          >
            {SURAHS.find((s) => s.id === element.surahId)?.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
