import { LinkSource } from '@/types';

/** Translation ids for each reciter provider, shared by cards and filters. */
export const SOURCE_LABEL_IDS: Record<LinkSource, string> = {
  [LinkSource.MP3QURAN]: 'settings.source.mp3quran',
  [LinkSource.MP3QURAN_V4]: 'settings.source.mp3quranv4',
  [LinkSource.ITQAN]: 'settings.source.itqan',
  [LinkSource.QURANAI]: 'settings.source.quranai',
  [LinkSource.QURAN_FOUNDATION]: 'settings.source.quranfoundation',
};
