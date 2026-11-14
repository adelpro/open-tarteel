/**
 * Pinned inputs for the follow-along data build.
 *
 * Nothing here may float: no branches, no "latest". A build that cannot match
 * these digests must stop. See docs/follow-along/data-sources.md.
 */

export const SOURCES = [
  {
    id: 'text',
    // The exact copy cpfair annotated against (Tanzil Uthmani v1.0.2).
    url: 'https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt',
    sha256: 'abe6447a5d29bb126383ba9120628060cf96dc9ef5b402a506fc251f6ed0b9a2',
    path: 'data/sources/quran-uthmani.txt',
    ayahs: 6236,
  },
  {
    id: 'tajweed',
    url: 'https://cdn.jsdelivr.net/gh/cpfair/quran-tajweed@6689c33bf3d903d1ef75bef62a83750e0a5a7737/output/tajweed.hafs.uthmani-pause-sajdah.json',
    sha256: '151d616ad37a4cc21a80f20d5e1104c5b408375107ddd4d71247dea4c05ebf67',
    path: 'data/sources/tajweed.json',
    ayahs: 6236,
  },
];

export const EXPECTED = {
  ayahs: 6236,
  words: 77878,
  basmalaWords: 448,
  providerWords: 77430,
  // sha256 of every ayah text joined with "\n", in mushaf order
  corpusSha256:
    '379fc74a2312d28a3331b07cadd96843f3871bbcb43c1310275dc8d2ac75ac9e',
  surahsWithBasmala: 112,
};

export const DATA_VERSION = '1.0.2+cpfair.6689c33';
export const OUTPUT_DIR = 'public/data/quran';
