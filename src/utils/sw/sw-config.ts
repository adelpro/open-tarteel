export const swConfig = {
  DB_NAME: process.env.NEXT_PUBLIC_DB_NAME || 'quran-offline',
  DB_VERSION: process.env.NEXT_PUBLIC_DB_VERSION || 2,
  TRACKS_STORE: process.env.NEXT_PUBLIC_TRACKS_STORE || 'tracks',
  AUDIO_STORE: process.env.NEXT_PUBLIC_AUDIO_STORE || 'audio',

  DEBUG_SW: process.env.NEXT_PUBLIC_DEBUG_SW === 'true',
};
