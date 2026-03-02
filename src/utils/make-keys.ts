import { PlaylistItem, RecentReciterKey, Reciter } from '@/types';

export function makeRecentReciterKey(
  reciterId: Reciter['id'],
  moshafId: Reciter['moshaf']['id'],
  locale: string
): RecentReciterKey {
  return `${reciterId}::${moshafId}::${locale}`;
}

export function makeTrackId(
  reciterId: Reciter['id'],
  moshafId: Reciter['moshaf']['id'],
  surahId: PlaylistItem['surahId']
): RecentReciterKey {
  return `${reciterId}::${moshafId}::${surahId}`;
}
