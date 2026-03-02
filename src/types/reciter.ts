import { Riwaya } from '@/constants';
import { LinkSource, Playlist } from '@/types';

export type Moshaf = {
  id: string;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: number;
  playlist: Playlist;
};

export type Reciter = {
  id: string;
  name: string;
  moshaf: Moshaf;
  source: LinkSource;
};

export type MP3APIMoshaf = {
  id: number;
  name: string;
  letter: string;
  date: string;
  server: string;
  surah_total: number;
  moshaf_type: string;
  surah_list: string;
};
export type mp3QuranAPiResponse = {
  reciters: {
    id: number;
    name: string;
    moshaf: MP3APIMoshaf[];
  }[];
};
