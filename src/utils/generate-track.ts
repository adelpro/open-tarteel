import { DOWNLOAD_STATUS } from '@/constants';
import { PlayerTrack, Playlist, Reciter, Track } from '@/types';
import { getSurahInfo, makeTrackId, removeTashkeel } from '@/utils';

export function toPlayerTrack({
  reciter,
  playlistItem,
  duration,
}: {
  reciter: Reciter | null | undefined;
  playlistItem: Playlist[number] | undefined;
  duration: number | undefined;
}): PlayerTrack | null {
  if (!reciter || !playlistItem || !duration) return null;

  return {
    id: makeTrackId(reciter.id, reciter.moshaf.id, playlistItem.surahId),
    reciterId: String(reciter.id),
    moshafId: String(reciter.moshaf.id),
    surahId: playlistItem.surahId,
    link: playlistItem.link,
  };
}

export function toPlayerTracks({
  playlist,
  reciter,
  // FIXME:
  duration = 1,
}: {
  playlist: Reciter['moshaf']['playlist'];
  reciter: Reciter;
  duration?: number;
}): PlayerTrack[] {
  return playlist
    .map((item) => toPlayerTrack({ playlistItem: item, reciter, duration }))
    .filter((track): track is PlayerTrack => track !== null);
}

export function toLibraryTrack({
  reciter,
  playlistItem,
  duration,
}: {
  reciter: Reciter | null | undefined;
  playlistItem: Playlist[number] | undefined;
  duration: number | undefined;
}): Track | null {
  if (!reciter || !playlistItem) return null;

  const surah = getSurahInfo(playlistItem.surahId);

  return {
    id: makeTrackId(reciter.id, reciter.moshaf.id, playlistItem.surahId),
    reciterId: String(reciter.id),
    moshafId: String(reciter.moshaf.id),
    surahId: playlistItem.surahId,
    link: playlistItem.link,
    reciterName: reciter.name,
    moshafName: reciter.moshaf.name,
    surahName: removeTashkeel(surah?.name),
    surahNameEn: surah?.englishName,

    //
    // reciter: {
    //   id: String(reciter.id),
    //   name: {
    //     ar: reciter.name,
    //     en: '', // FIXME: leave it for now
    //   },
    // },
    // moshaf: {
    //   id: String(reciter.moshaf.id),
    //   name: {
    //     ar: reciter.moshaf.name,
    //     en: reciter.moshaf.name, // FIXME: leave it for now
    //   },
    // },
    // surah: {
    //   id: String(playlistItem.surahId),
    //   name: {
    //     ar: removeTashkeel(surah?.name),
    //     en: surah?.englishName,
    //   },
    // },
    //
    duration,
    addedAt: 0,
    downloadedBytes: 0,
    progress: 0,
    status: DOWNLOAD_STATUS.IDLE,
    totalBytes: 0,
    speed: 0,
  };
}
