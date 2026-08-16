import { describe, expect, it } from 'vitest';
import { resolveChapterReciterId } from '@/utils/resolveChapterReciterId';

describe('resolveChapterReciterId', () => {
  it('should return the correct Quran Foundation reciter ID for valid mp3quran reciter and moshaf', () => {
    const result = resolveChapterReciterId(
      'mp3quran.net-5',
      '5',
      'quranFoundation'
    );
    expect(result).toBe(19);
  });

  it('should default targetProvider to quranFoundation', () => {
    const result = resolveChapterReciterId('mp3quran.net-5', '5');
    expect(result).toBe(19);
  });

  it('should return null when ID is empty or undefined', () => {
    expect(resolveChapterReciterId(undefined, '5')).toBeNull();
    expect(resolveChapterReciterId('', '5')).toBeNull();
  });

  it('should return null when moshafId is empty or undefined', () => {
    expect(resolveChapterReciterId('mp3quran.net-5', undefined)).toBeNull();
    expect(resolveChapterReciterId('mp3quran.net-5', '')).toBeNull();
  });

  it('should return null for non-mp3quran IDs', () => {
    expect(resolveChapterReciterId('itqan-123', '1')).toBeNull();
  });

  it('should return null for non-existent reciter or moshaf', () => {
    expect(resolveChapterReciterId('mp3quran.net-999999', '999999')).toBeNull();
  });
});
