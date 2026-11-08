export type PlaylistItem = {
  surahId: string;
  link: string;
  /** False when this provider knows the surah has no ayah timings. */
  hasTimings?: boolean;
};

export type Playlist = PlaylistItem[];
