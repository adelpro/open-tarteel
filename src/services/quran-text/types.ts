/** Shapes of the generated Quran data. See docs/follow-along/reference-index.md. */

/** Half-open codepoint range into an ayah text. */
export type TajweedRule = [rule: string, start: number, end: number];

export interface AyahData {
  /** Verbatim Tanzil text. Never edited. */
  t: string;
  /** Word count, derived by splitting on U+0020. */
  w: number;
  /** Basmala words at the start of ayah 1: 4, or 0 for surah 1 and 9. */
  b: number;
  /** Tajweed ranges in codepoints, basmala offsets intact. */
  r: TajweedRule[];
}

export interface SurahData {
  surah: number;
  ayahs: AyahData[];
}

export interface ManifestFile {
  surah: number;
  ayahs: number;
  words: number;
  sha256: string;
}

export interface QuranManifest {
  schema: number;
  dataVersion: string;
  text: {
    name: string;
    version: string;
    url: string;
    sha256: string;
    ayahs: number;
    license: string;
  };
  tajweed: {
    repo: string;
    commit: string;
    path: string;
    sha256: string;
    license: string;
  };
  totals: {
    ayahs: number;
    words: number;
    basmalaWords: number;
    providerWords: number;
  };
  corpusSha256: string;
  files: ManifestFile[];
}
