import type { Language } from '@/constants/language';
import type { LinkSource, Moshaf, Playlist, Reciter } from '@/types';

export type ReciterSource = {
  readonly source: LinkSource;
  getReciters(_lang: Language): Promise<Reciter[]>;
  /** Optional lazy track list for providers whose catalog omits playlists. */
  getPlaylist?(_moshaf: Moshaf, _lang: Language): Promise<Playlist>;
};
