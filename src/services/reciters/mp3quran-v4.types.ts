export type Mp3QuranV4ReciterRef = {
  id: number;
  code: string;
  name: string;
};

export type Mp3QuranV4Riwayah = {
  code: string;
  qiraah: string;
  name: string;
};

export type Mp3QuranV4Recitation = {
  id: number;
  reciter: Mp3QuranV4ReciterRef;
  riwayahs: Mp3QuranV4Riwayah[];
  qiraahs: string[];
  code: string;
  tariq: string | null;
  wajh: string | null;
  style: string;
  has_ayah_timings: boolean;
  coverage: { complete: boolean; surahs: number[] };
  total_duration_ms: number;
  audio: {
    base: string;
    files: {
      original: string;
      mp3_64?: string;
      opus_48?: string;
    };
  };
};

export type Mp3QuranV4List<T> = {
  data: T[];
  meta?: Record<string, unknown>;
  links?: { self?: string; next?: string };
};
