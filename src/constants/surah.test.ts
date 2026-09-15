import { describe, expect, it } from 'vitest';

import { SURAHS } from './surah';

describe('SURAHS data integrity', () => {
  it('contains all 114 surahs with unique sequential ids', () => {
    expect(SURAHS).toHaveLength(114);
    const ids = SURAHS.map((surah) => surah.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 114 }, (_, index) => index + 1));
  });

  it('provides a non-empty name in every locale for every surah', () => {
    for (const surah of SURAHS) {
      expect(surah.name.trim(), `surah ${surah.id} arabic name`).not.toBe('');
      expect(
        surah.englishName.trim(),
        `surah ${surah.id} english name`
      ).not.toBe('');
      expect(surah.germanName.trim(), `surah ${surah.id} german name`).not.toBe(
        ''
      );
      expect(surah.ayahCount, `surah ${surah.id} ayah count`).toBeGreaterThan(
        0
      );
    }
  });
});
