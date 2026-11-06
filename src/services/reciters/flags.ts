/** Feature flags that are safe to evaluate on both server and client. */
export const isMp3QuranV4Enabled = (): boolean =>
  process.env.NEXT_PUBLIC_ENABLE_MP3QURAN_V4 === 'true';
