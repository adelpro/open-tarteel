export const LinkSource = {
  MP3QURAN: 'mp3quran.net',
  ITQAN: 'itqan.dev',
  QURANAI: 'qurani.ai',
  QURAN_FOUNDATION: 'quran.foundation',
} as const;

export type LinkSource = (typeof LinkSource)[keyof typeof LinkSource];
