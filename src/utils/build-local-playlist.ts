import type { Playlist, Reciter } from '@/types';
import { LinkSource } from '@/types';

/** Build MP3Quran/Qurani.ai playlists from the compact catalog hints. */
export const buildLocalPlaylist = (reciter: Reciter): Playlist | null => {
  const { moshaf } = reciter;

  if (
    reciter.source === LinkSource.MP3QURAN &&
    moshaf.server &&
    moshaf.surahIds
  ) {
    return moshaf.surahIds
      .split(',')
      .filter(Boolean)
      .map((surahId) => ({
        surahId,
        link: `${moshaf.server}${surahId.padStart(3, '0')}.mp3`,
      }));
  }

  if (reciter.source === LinkSource.QURANAI && moshaf.server) {
    const total = Number(moshaf.surah_total) || 114;
    return Array.from({ length: total }, (_, index) => {
      const surahNumber = index + 1;
      return {
        surahId: String(surahNumber),
        link: `${moshaf.server}${surahNumber}.mp3`,
      };
    });
  }

  return null;
};
