import type { LinkSource } from './link-source';
import type { Playlist } from './playlist';
import type { Riwaya } from './riwaya';

export type Moshaf = {
  id: string;
  name: string;
  riwaya: Riwaya;
  server: string;
  surah_total: string;
  /** Compact source list for lazy playlist generation (e.g. MP3Quran). */
  surahIds?: string;
  playlist: Playlist;
};

export type Reciter = {
  id: string;
  name: string;
  moshaf: Moshaf;
  source: LinkSource;
};
