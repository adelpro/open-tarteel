import type { Moshaf } from '@/types';

export type AyahTiming = {
  ayah: number;
  startMs: number;
  endMs: number;
};

export type TimingProvider = {
  getSurahTimings: (_moshaf: Moshaf, _surah: number) => Promise<AyahTiming[]>;
};

/** One timed word, exactly as a provider numbers it. */
export type WordTiming = {
  /** 1-based ayah number inside the surah. */
  ayah: number;
  /** 1-based provider word number inside the ayah. */
  word: number;
  startMs: number;
  endMs: number;
};

export type WordTimingProvider = {
  getSurahWordTimings: (
    _moshaf: Moshaf,
    _surah: number
  ) => Promise<WordTiming[]>;
};
