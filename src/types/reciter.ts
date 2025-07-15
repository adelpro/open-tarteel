import { LinkSource, Riwaya } from '@/types';

export type Moshaf = {
  id: string;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: string;
  playlist: string[];
};

//TODO delete   riwaya: Riwaya; here
export type Reciter = {
  id: number;
  name: string;
  moshaf: Moshaf;
  source: LinkSource;
};
export type MP3APIMoshaf = {
  id: string;
  name: string;
  letter: string;
  date: string;
  server: string;
  surah_total: string;
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
