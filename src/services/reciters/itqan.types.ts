export type ItqanRecitationResponse = {
  results: {
    id: number;
    name: string;
    description: string;
    publisher: { id: number; name: string };
    reciter: { id: number; name: string };
    riwayah: { id: number; name: string };
    surahs_count: number;
  }[];
};

export type ItqanSurah = {
  surah_number: number;
  surah_name: string;
  surah_name_en: string;
  audio_url: string;
  duration_ms: number;
  size_bytes: number;
  revelation_order: number;
  revelation_place: string;
  ayahs_count: number;
  ayahs_timings: unknown[];
};

export type ItqanRecitationDetailResponse = {
  results: ItqanSurah[];
  count: number;
};
