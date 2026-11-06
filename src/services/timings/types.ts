import type { Moshaf } from '@/types';

export type AyahTiming = {
  ayah: number;
  startMs: number;
  endMs: number;
};

export type TimingProvider = {
  getSurahTimings: (_moshaf: Moshaf, _surah: number) => Promise<AyahTiming[]>;
};
