import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { QuranManifest, SurahData } from './types';
import { basmalaWordCount, wordSpans } from './words';

const DIR = join(process.cwd(), 'public/data/quran');
const manifest: QuranManifest = JSON.parse(
  readFileSync(join(DIR, 'manifest.json'), 'utf8')
);

const surahFiles: SurahData[] = manifest.files.map((file) =>
  JSON.parse(readFileSync(join(DIR, `${file.surah}.json`), 'utf8'))
);

describe('generated Quran data', () => {
  it('has the expected totals', () => {
    expect(manifest.files).toHaveLength(114);
    expect(manifest.totals).toEqual({
      ayahs: 6236,
      words: 77878,
      basmalaWords: 448,
      providerWords: 77430,
    });
    expect(manifest.corpusSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('agrees with the runtime splitter for every ayah', () => {
    const mismatches: string[] = [];
    let basmalaSurahs = 0;

    for (const surah of surahFiles) {
      for (const [index, ayah] of surah.ayahs.entries()) {
        const ayahNumber = index + 1;
        const spans = wordSpans(ayah.t);
        if (spans.length !== ayah.w) {
          mismatches.push(
            `${surah.surah}:${ayahNumber} w=${ayah.w} split=${spans.length}`
          );
        }
        const basmala = basmalaWordCount(ayah.t, surah.surah, ayahNumber);
        if (basmala !== ayah.b) {
          mismatches.push(
            `${surah.surah}:${ayahNumber} b=${ayah.b} detected=${basmala}`
          );
        }
        if (ayahNumber === 1 && ayah.b === 4) basmalaSurahs++;
      }
    }

    expect(mismatches).toEqual([]);
    expect(basmalaSurahs).toBe(112);
  });

  it('keeps every tajweed range inside its ayah', () => {
    let outOfBounds = 0;
    for (const surah of surahFiles) {
      for (const ayah of surah.ayahs) {
        for (const [, start, end] of ayah.r) {
          if (!(start >= 0 && end > start && end <= ayah.t.length)) {
            outOfBounds++;
          }
        }
      }
    }
    expect(outOfBounds).toBe(0);
  });

  it('pins the ayat the alignment depends on', () => {
    const counts = new Map<string, { w: number; b: number }>();
    for (const surah of surahFiles) {
      for (const [index, ayah] of surah.ayahs.entries()) {
        counts.set(`${surah.surah}:${index + 1}`, { w: ayah.w, b: ayah.b });
      }
    }

    expect(counts.get('1:1')).toEqual({ w: 4, b: 0 });
    expect(counts.get('9:1')).toEqual({ w: 9, b: 0 });
    expect(counts.get('112:1')).toEqual({ w: 8, b: 4 });
    expect(counts.get('2:181')).toEqual({ w: 13, b: 0 });
    expect(counts.get('8:6')).toEqual({ w: 11, b: 0 });
    expect(counts.get('13:37')).toEqual({ w: 19, b: 0 });
    expect(counts.get('37:130')).toEqual({ w: 4, b: 0 });
  });
});
