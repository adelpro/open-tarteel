import { LinkSource, Playlist, Riwaya } from '@/types';

export type Moshaf = {
  id: string;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: string;
  playlist: Playlist;
};

export type Reciter = {
  id: string;
  name: string;
  moshaf: Moshaf;
  source: LinkSource;
};
