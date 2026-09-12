import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, Riwaya } from '@/types';

import {
  getAyahAudioRange,
  MAX_AYAHS_IN_SURAH,
  QuranAiAdapter,
} from './quranai.adapter';
import {
  createDefaultFetchMock,
  makeEdition,
  makeEditionsResponse,
  makeFetchResponse,
  makeSurahResponse,
  PROBE_IBRAHIM_URL,
} from './quranai.test-fixtures';

const defaultFetchMock = createDefaultFetchMock();

describe('QuranAiAdapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', defaultFetchMock);
    vi.mocked(fetch).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('source', () => {
    it('is LinkSource.QURANAI', () => {
      expect(QuranAiAdapter.source).toBe(LinkSource.QURANAI);
    });
  });

  describe('getReciters', () => {
    it('fetches the editions list first', async () => {
      await QuranAiAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/edition/?format=audio')
      );
    });

    it('fetches a single probe surah per edition instead of all 114 surahs', async () => {
      await QuranAiAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/surah/1/ar.ibrahimakhdar.hafs?limit=1')
      );
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/surah/2/ar.ibrahimakhdar.hafs')
      );
      expect(fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/surah/114/ar.ibrahimakhdar.hafs')
      );
    });

    it('returns one Reciter per surah-type edition', async () => {
      const reciters = await QuranAiAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
      expect(reciters[0].source).toBe(LinkSource.QURANAI);
    });

    it('builds a source-prefixed string ID from the edition identifier', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.id).toBe(`${LinkSource.QURANAI}-ar.ibrahimakhdar.hafs`);
    });

    it('maps the reciter name for ar', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.name).toBe('إبراهيم الأخضر');
    });

    it('maps the reciter name for en', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('en');
      expect(reciter.name).toBe('Ibrahim Al-Akhdar');
    });

    it('maps moshaf id to the edition identifier', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.id).toBe('ar.ibrahimakhdar.hafs');
    });

    it('resolves riwaya from the narrator identifier', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.riwaya).toBe(Riwaya.Hafs);
    });

    it('names the moshaf after the riwaya key', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.name).toBe('Hafs');
    });

    it('builds a playlist of 114 items derived from the probe directory', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      const { playlist } = reciter.moshaf;
      expect(playlist).toHaveLength(114);
      expect(playlist.map((item) => item.surahId)).toEqual(
        Array.from({ length: 114 }, (_, index) => String(index + 1))
      );
    });

    it('preserves the exact probe URL for surah 1', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist[0]).toEqual({
        surahId: '1',
        link: PROBE_IBRAHIM_URL,
      });
    });

    it('generates the surah 2 URL from the same directory as the probe', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist[1]).toEqual({
        surahId: '2',
        link: 'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/2.mp3',
      });
    });

    it('generates the surah 114 URL correctly', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist[113]).toEqual({
        surahId: '114',
        link: 'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/114.mp3',
      });
    });

    it('does not hardcode the CDN hostname or bitrate', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/edition/')) {
            return makeFetchResponse({
              code: 200,
              status: 'OK',
              data: [makeEdition({})],
            });
          }
          return makeFetchResponse(
            makeSurahResponse(
              'https://cdn.other.example.net/quran/audio/surah/7/ar.ibrahimakhdar.hafs/1.mp3'
            )
          );
        })
      );

      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist[0].link).toBe(
        'https://cdn.other.example.net/quran/audio/surah/7/ar.ibrahimakhdar.hafs/1.mp3'
      );
      expect(reciter.moshaf.playlist[1].link).toBe(
        'https://cdn.other.example.net/quran/audio/surah/7/ar.ibrahimakhdar.hafs/2.mp3'
      );
      expect(reciter.moshaf.playlist[113].link).toBe(
        'https://cdn.other.example.net/quran/audio/surah/7/ar.ibrahimakhdar.hafs/114.mp3'
      );
    });

    it('sets surah_total to the playlist length as a string', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.surah_total).toBe('114');
    });

    it('sets server to an empty string', async () => {
      const [reciter] = await QuranAiAdapter.getReciters('ar');
      expect(reciter.moshaf.server).toBe('');
    });

    it('deduplicates editions with the same identifier', async () => {
      await QuranAiAdapter.getReciters('ar');
      const surahCalls = vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url]) =>
            String(url).includes('/surah/') &&
            String(url).includes('ar.ibrahimakhdar.hafs')
        );
      expect(surahCalls).toHaveLength(1);
    });

    it('skips an edition when the probe response has no data.audio', async () => {
      const reciters = await QuranAiAdapter.getReciters('ar');
      expect(reciters.map((r) => r.moshaf.id)).toEqual([
        'ar.ibrahimakhdar.hafs',
      ]);
    });

    it('skips an edition when the probe URL is malformed', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/edition/')) {
            return makeFetchResponse(makeEditionsResponse());
          }
          if (url.includes('ar.ibrahimakhdar.hafs')) {
            return makeFetchResponse(makeSurahResponse('not-a-valid-url'));
          }
          return makeFetchResponse(makeSurahResponse(''));
        })
      );

      const reciters = await QuranAiAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('skips an edition when the probe URL does not end in a numeric mp3', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/edition/')) {
            return makeFetchResponse(makeEditionsResponse());
          }
          if (url.includes('ar.ibrahimakhdar.hafs')) {
            return makeFetchResponse(
              makeSurahResponse(
                'https://quranhub.b-cdn.net/quran/audio/surah/48/ar.ibrahimakhdar.hafs/1.ogg'
              )
            );
          }
          return makeFetchResponse(makeSurahResponse(''));
        })
      );

      const reciters = await QuranAiAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('skips an edition whose probe fails without affecting other editions', async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/edition/')) {
            return makeFetchResponse(makeEditionsResponse());
          }
          if (url.includes('/surah/1/ar.ghamdi.hafs')) {
            return makeFetchResponse(
              makeSurahResponse(
                'https://quranhub.b-cdn.net/quran/audio/surah/64/ar.ghamdi.hafs/1.mp3'
              )
            );
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: vi.fn(),
          } as unknown as Response);
        })
      );

      const promise = QuranAiAdapter.getReciters('ar');
      const recitersPromise = promise.then(
        (reciters) => reciters,
        (error: unknown) => {
          throw error;
        }
      );
      await vi.advanceTimersByTimeAsync(10_000);
      const reciters = await recitersPromise;
      expect(reciters).toHaveLength(1);
      expect(reciters[0].moshaf.id).toBe('ar.ghamdi.hafs');
    });

    it('returns an empty list when the editions response has no data array', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ code: 200, status: 'OK', data: undefined })
          )
      );
      const reciters = await QuranAiAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('throws when the editions list endpoint returns a non-ok response', async () => {
      vi.useFakeTimers();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: vi.fn(),
        } as unknown as Response)
      );
      const promise = QuranAiAdapter.getReciters('ar');
      const assertion = expect(promise).rejects.toThrow('HTTP 500');
      await vi.advanceTimersByTimeAsync(10_000);
      await assertion;
    });
  });

  describe('getAyahAudioRange', () => {
    const rangeUrl = (surahNumber: number, limit: number, offset: number) =>
      `https://api.qurani.ai/gw/qh/v1/surah/${surahNumber}/ar.ibrahimakhdar.hafs?limit=${limit}&offset=${offset}`;

    const CACHED_FETCH_OPTIONS = { next: { revalidate: 3600 } };

    it('fetches the surah endpoint with a limit and offset derived from the range', async () => {
      await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 3,
      });
      expect(fetch).toHaveBeenCalledWith(
        rangeUrl(2, 3, 0),
        CACHED_FETCH_OPTIONS
      );
    });

    it('maps offset from startAyah (zero-based) and limit from the range size', async () => {
      await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 101,
        endAyah: 105,
      });
      expect(fetch).toHaveBeenCalledWith(
        rangeUrl(2, 5, 100),
        CACHED_FETCH_OPTIONS
      );
    });

    it('returns normalized ayah audio items', async () => {
      const ayahs = await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 3,
      });
      expect(ayahs).toHaveLength(3);
      expect(ayahs[0]).toEqual({
        surahId: '2',
        ayahNumber: 1,
        link: 'https://quranhub.b-cdn.net/quran/audio/versebyverse/32/ar.ibrahimakhdar.hafs/8.mp3',
      });
      expect(ayahs[2]).toEqual({
        surahId: '2',
        ayahNumber: 3,
        link: 'https://quranhub.b-cdn.net/quran/audio/versebyverse/32/ar.ibrahimakhdar.hafs/10.mp3',
      });
    });

    it('drops ayahs with missing audio', async () => {
      const response = makeSurahResponse('', 4, 'audio-present');
      response.data.ayahs = response.data.ayahs.map((ayah) =>
        ayah.numberInSurah === 2 ? { ...ayah, audio: '' } : ayah
      );
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeFetchResponse(response))
      );

      const ayahs = await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 4,
      });
      expect(ayahs.map((a) => a.ayahNumber)).toEqual([1, 3, 4]);
    });

    it('clamps the range to the surah ayah count', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse(makeSurahResponse('', 7, 'audio-present'))
          )
      );
      const ayahs = await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 100,
      });
      expect(ayahs).toHaveLength(7);
    });

    it('uses endAyah when numberOfAyahs is missing', async () => {
      const response = makeSurahResponse('', 3, 'audio-present');
      delete (response.data as { numberOfAyahs?: number }).numberOfAyahs;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeFetchResponse(response))
      );

      const ayahs = await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 100,
      });
      expect(ayahs.map((a) => a.ayahNumber)).toEqual([1, 2, 3]);
    });

    it('uses endAyah when numberOfAyahs is not a valid integer', async () => {
      const response = makeSurahResponse('', 3, 'audio-present');
      response.data.numberOfAyahs = '7' as unknown as number;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeFetchResponse(response))
      );

      const ayahs = await getAyahAudioRange({
        editionIdentifier: 'ar.ibrahimakhdar.hafs',
        surahNumber: 2,
        startAyah: 1,
        endAyah: 100,
      });
      expect(ayahs).toHaveLength(3);
    });

    it('rejects ranges that exceed the maximum surah size', async () => {
      await expect(
        getAyahAudioRange({
          editionIdentifier: 'ar.ibrahimakhdar.hafs',
          surahNumber: 2,
          startAyah: MAX_AYAHS_IN_SURAH + 1,
          endAyah: MAX_AYAHS_IN_SURAH + 1,
        })
      ).rejects.toThrow();
      await expect(
        getAyahAudioRange({
          editionIdentifier: 'ar.ibrahimakhdar.hafs',
          surahNumber: 2,
          startAyah: 1,
          endAyah: MAX_AYAHS_IN_SURAH + 1,
        })
      ).rejects.toThrow();
    });

    it('never sends a huge provider request for a huge ayah range', async () => {
      await expect(
        getAyahAudioRange({
          editionIdentifier: 'ar.ibrahimakhdar.hafs',
          surahNumber: 2,
          startAyah: 1,
          endAyah: 100_000,
        })
      ).rejects.toThrow();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('throws when the response has no ayahs array', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ code: 200, status: 'OK', data: undefined })
          )
      );
      await expect(
        getAyahAudioRange({
          editionIdentifier: 'ar.ibrahimakhdar.hafs',
          surahNumber: 2,
          startAyah: 1,
          endAyah: 3,
        })
      ).rejects.toThrow('invalid surah response');
    });

    it.each([
      { surahNumber: 0, startAyah: 1, endAyah: 3 },
      { surahNumber: 115, startAyah: 1, endAyah: 3 },
      { surahNumber: 2, startAyah: 0, endAyah: 3 },
      { surahNumber: 2, startAyah: 5, endAyah: 3 },
      { surahNumber: 2, startAyah: 287, endAyah: 300 },
      { surahNumber: 2, startAyah: 1, endAyah: 1000 },
    ])('throws for invalid range %o', async (params) => {
      await expect(
        getAyahAudioRange({
          editionIdentifier: 'ar.ibrahimakhdar.hafs',
          ...params,
        })
      ).rejects.toThrow();
    });
  });
});
