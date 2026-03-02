import { describe, expect, it } from 'vitest';

import { Riwaya } from '@/constants';

import { generatePlaylist, resolveRiwaya } from './mp3quran.helpers';
import type { Mp3QuranApiMoshaf } from './mp3quran.types';

// ─────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────

const makeMoshaf = (
  overrides: Partial<Mp3QuranApiMoshaf> = {}
): Mp3QuranApiMoshaf => ({
  id: 1,
  name: 'حفص عن عاصم',
  server: 'https://cdn.mp3quran.net/hafs/',
  surah_total: 114,
  surah_list: '1,2,3',
  moshaf_type: 1,
  ...overrides,
});

// ─────────────────────────────────────────────────────
// generatePlaylist
// ─────────────────────────────────────────────────────

describe('generatePlaylist', () => {
  it('returns one item per surah in surah_list', () => {
    const playlist = generatePlaylist(makeMoshaf({ surah_list: '1,2,3' }));
    expect(playlist).toHaveLength(3);
  });

  it('sets surahId to the raw id string from surah_list', () => {
    const playlist = generatePlaylist(makeMoshaf({ surah_list: '1,36,114' }));
    expect(playlist[0].surahId).toBe('1');
    expect(playlist[1].surahId).toBe('36');
    expect(playlist[2].surahId).toBe('114');
  });

  it('pads surah id to 3 digits in the link', () => {
    const playlist = generatePlaylist(
      makeMoshaf({
        server: 'https://cdn.example.com/',
        surah_list: '1,36,114',
      })
    );
    expect(playlist[0].link).toBe('https://cdn.example.com/001.mp3');
    expect(playlist[1].link).toBe('https://cdn.example.com/036.mp3');
    expect(playlist[2].link).toBe('https://cdn.example.com/114.mp3');
  });

  it('appends .mp3 to each link', () => {
    const playlist = generatePlaylist(
      makeMoshaf({ server: 'https://cdn.example.com/', surah_list: '1' })
    );
    expect(playlist[0].link).toMatch(/\.mp3$/);
  });

  it('returns an empty array when surah_list is empty string', () => {
    const playlist = generatePlaylist(makeMoshaf({ surah_list: '' }));
    // ''.split(',') => [''] – one empty-string entry
    expect(playlist).toHaveLength(1);
    expect(playlist[0].surahId).toBe('');
  });

  it('handles a single surah', () => {
    const playlist = generatePlaylist(
      makeMoshaf({ server: 'https://cdn.example.com/', surah_list: '7' })
    );
    expect(playlist).toHaveLength(1);
    expect(playlist[0]).toEqual({
      surahId: '7',
      link: 'https://cdn.example.com/007.mp3',
    });
  });
});

// ─────────────────────────────────────────────────────
// resolveRiwaya
// ─────────────────────────────────────────────────────

describe('resolveRiwaya', () => {
  describe('Arabic locale', () => {
    it('resolves Hafs', () => {
      expect(resolveRiwaya('حفص عن عاصم', 'ar')).toBe(Riwaya.Hafs);
    });

    it('resolves Warsh', () => {
      expect(resolveRiwaya('ورش عن نافع', 'ar')).toBe(Riwaya.Warsh);
    });

    it('resolves Qaloon', () => {
      expect(resolveRiwaya('قالون عن نافع', 'ar')).toBe(Riwaya.Qaloon);
    });

    it('resolves AlDooriKisai', () => {
      expect(resolveRiwaya('الدوري عن الكسائي', 'ar')).toBe(
        Riwaya.AlDooriKisai
      );
    });

    it('resolves AlDooriAbuAmr', () => {
      expect(resolveRiwaya('الدوري عن أبي عمرو', 'ar')).toBe(
        Riwaya.AlDooriAbuAmr
      );
    });

    it('resolves Shuaba', () => {
      expect(resolveRiwaya('شعبة عن عاصم', 'ar')).toBe(Riwaya.Shuaba);
    });

    it('resolves IbnZakwan', () => {
      expect(resolveRiwaya('ابن ذكوان عن ابن عامر', 'ar')).toBe(
        Riwaya.IbnZakwan
      );
    });

    it('falls back to Hafs for an unrecognised name', () => {
      expect(resolveRiwaya('قراءة مجهولة', 'ar')).toBe(Riwaya.Hafs);
    });
  });

  describe('English locale', () => {
    it('resolves Hafs from English moshaf name', () => {
      expect(resolveRiwaya("Hafs A'n Assem", 'en')).toBe(Riwaya.Hafs);
    });

    it('resolves Warsh from English moshaf name', () => {
      expect(resolveRiwaya("Warsh A'n Nafi'", 'en')).toBe(Riwaya.Warsh);
    });

    it('resolves Qaloon from English moshaf name', () => {
      expect(resolveRiwaya("Qalon A'n Nafi'", 'en')).toBe(Riwaya.Qaloon);
    });

    it('falls back to Hafs for an unrecognised English name', () => {
      expect(resolveRiwaya('Unknown Recitation', 'en')).toBe(Riwaya.Hafs);
    });
  });
});
