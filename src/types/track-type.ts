export type TrackType = {
  id: string; // `${reciterId}_${moshafId}_${surahId}`
  reciterId: string;
  moshafId: string;
  surahId: string;
  url: string;

  surahName?: string;
  surahNameEn?: string;
  reciterName?: string;
  moshafName?: string;
  duration?: number;
};
