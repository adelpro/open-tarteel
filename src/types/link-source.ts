export const LinkSource = {
  MP3QURAN: 'mp3quran.net',
  MP3QURAN_V4: 'mp3quran.v4',
  ITQAN: 'itqan.dev',
  QURANAI: 'qurani.ai',
  QURAN_FOUNDATION: 'quran.foundation',
} as const;

export type LinkSource = (typeof LinkSource)[keyof typeof LinkSource];
