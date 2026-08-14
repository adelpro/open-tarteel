import { describe, expect, it } from 'vitest';

import { Riwaya } from '@/types';

import {
  buildSurahAudioUrl,
  buildSurahEndpoint,
  extractSurahAudio,
  extractSurahAudioBaseUrl,
  QURANAI_BASE_URL,
  resolveReciterName,
  resolveRiwayaFromNarrator,
} from './quranai.helpers';
import type { QuranAiEdition, QuranAiSurahResponse } from './quranai.types';

const makeEdition = (
  overrides: Partial<QuranAiEdition> = {}
): QuranAiEdition => ({
  identifier: 'ar.ibrahimakhdar.hafs',
  language: 'ar',
  name: 'إبراهيم الأخضر',
  englishName: 'Ibrahim Al-Akhdar',
  format: 'audio',
  type: 'surah',
  direction: null,
  narratorIdentifier: 'quran-hafs',
  ...overrides,
});

describe('buildSurahEndpoint', () => {
  it('builds the surah endpoint without query params', () => {
    expect(buildSurahEndpoint(2, 'ar.ibrahimakhdar.hafs')).toBe(
      `${QURANAI_BASE_URL}/surah/2/ar.ibrahimakhdar.hafs`
    );
  });

  it('appends limit and offset query params', () => {
    expect(
      buildSurahEndpoint(2, 'ar.ibrahimakhdar.hafs', { limit: 3, offset: 0 })
    ).toBe(
      `${QURANAI_BASE_URL}/surah/2/ar.ibrahimakhdar.hafs?limit=3&offset=0`
    );
  });

  it('appends only the provided options', () => {
    expect(buildSurahEndpoint(2, 'ar.ibrahimakhdar.hafs', { offset: 3 })).toBe(
      `${QURANAI_BASE_URL}/surah/2/ar.ibrahimakhdar.hafs?offset=3`
    );
  });
});

describe('resolveRiwayaFromNarrator', () => {
  // 'quran-qunbul' -> AlBazzi and 'quran-aldouri' -> AlDooriAbuAmr are
  // APPROXIMATIONS, not exact Quran.ai mappings (see quranai.helpers.ts).
  it.each([
    ['quran-hafs', Riwaya.Hafs],
    ['quran-warsh', Riwaya.Warsh],
    ['quran-qaloon', Riwaya.Qaloon],
    ['quran-albazzi', Riwaya.AlBazzi],
    ['quran-qunbul', Riwaya.AlBazzi],
    ['quran-aldouri', Riwaya.AlDooriAbuAmr],
    ['quran-alsoosi', Riwaya.AlSoosi],
    ['quran-shoba', Riwaya.Shuaba],
  ])('maps narrator identifier %s to %s', (narrator, riwaya) => {
    expect(resolveRiwayaFromNarrator(narrator)).toBe(riwaya);
  });

  it('falls back to Hafs for null narrator identifiers', () => {
    expect(resolveRiwayaFromNarrator(null)).toBe(Riwaya.Hafs);
  });

  it('falls back to Hafs for unknown narrator identifiers', () => {
    expect(resolveRiwayaFromNarrator('quran-unknown')).toBe(Riwaya.Hafs);
  });
});

describe('resolveReciterName', () => {
  it('uses the Arabic name for ar', () => {
    expect(resolveReciterName(makeEdition(), 'ar')).toBe('إبراهيم الأخضر');
  });

  it('uses the English name for en', () => {
    expect(resolveReciterName(makeEdition(), 'en')).toBe('Ibrahim Al-Akhdar');
  });

  it('falls back to the Arabic name for en when englishName is missing', () => {
    const edition = makeEdition({ englishName: '' });
    expect(resolveReciterName(edition, 'en')).toBe('إبراهيم الأخضر');
  });
});

describe('extractSurahAudio', () => {
  it('returns the audio URL when present', () => {
    const data = {
      audio:
        'https://quranhub.b-cdn.net/quran/audio/surah/2/ar.ibrahimakhdar.hafs/1.mp3',
    } as QuranAiSurahResponse['data'];
    expect(extractSurahAudio(data)).toBe(
      'https://quranhub.b-cdn.net/quran/audio/surah/2/ar.ibrahimakhdar.hafs/1.mp3'
    );
  });

  it('returns null for an empty audio string', () => {
    const data = { audio: '' } as QuranAiSurahResponse['data'];
    expect(extractSurahAudio(data)).toBeNull();
  });

  it('returns null when audio is missing', () => {
    const data = {} as QuranAiSurahResponse['data'];
    expect(extractSurahAudio(data)).toBeNull();
  });

  it('returns null when data is undefined', () => {
    expect(extractSurahAudio(undefined)).toBeNull();
  });
});

describe('extractSurahAudioBaseUrl', () => {
  const PROBE_URL =
    'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.mp3';

  it('derives the audio directory from a valid probe URL', () => {
    expect(extractSurahAudioBaseUrl(PROBE_URL)).toBe(
      'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/'
    );
  });

  it('keeps the full directory structure of the probe URL', () => {
    expect(
      extractSurahAudioBaseUrl(
        'https://cdn.example.net/a/b/c/audio/surah/64/ar.ghamdi.hafs/1.mp3'
      )
    ).toBe('https://cdn.example.net/a/b/c/audio/surah/64/ar.ghamdi.hafs/');
  });

  it('rejects malformed URLs', () => {
    expect(extractSurahAudioBaseUrl('not-a-valid-url')).toBeNull();
    expect(extractSurahAudioBaseUrl('https://')).toBeNull();
    expect(extractSurahAudioBaseUrl('')).toBeNull();
  });

  it('rejects non-http(s) protocols', () => {
    expect(
      extractSurahAudioBaseUrl(
        'ftp://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.mp3'
      )
    ).toBeNull();
  });

  it('rejects URLs that do not end in an mp3 file', () => {
    expect(
      extractSurahAudioBaseUrl(
        'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.ogg'
      )
    ).toBeNull();
  });

  it('rejects URLs whose filename is not numeric', () => {
    expect(
      extractSurahAudioBaseUrl(
        'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/ayah.mp3'
      )
    ).toBeNull();
  });
});

describe('buildSurahAudioUrl', () => {
  const BASE_URL =
    'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/';

  it('appends the surah number to the base directory', () => {
    expect(buildSurahAudioUrl(BASE_URL, 2)).toBe(
      'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/2.mp3'
    );
  });

  it('builds the surah 114 URL', () => {
    expect(buildSurahAudioUrl(BASE_URL, 114)).toBe(
      'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/114.mp3'
    );
  });
});
