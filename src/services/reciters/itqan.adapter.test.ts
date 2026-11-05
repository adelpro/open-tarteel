import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, Riwaya } from '@/types';

import { ItqanAdapter } from './itqan.adapter';
import type { ItqanRecitationResponse, ItqanSurah } from './itqan.types';

const makeRecitation = (
  id: number,
  reciterId: number,
  name: string
): ItqanRecitationResponse['results'][number] => ({
  id,
  name: `مصحف ${name}`,
  description: '',
  publisher: { id: 1, name: 'Itqan' },
  reciter: { id: reciterId, name },
  riwayah: { id: 1, name: 'حفص عن عاصم' },
  surahs_count: 114,
});

const makeTrack = (surahNumber: number): ItqanSurah => ({
  surah_number: surahNumber,
  surah_name: 'سورة',
  surah_name_en: 'Surah',
  audio_url: `https://storage.cms.itqan.dev/media/uploads/assets/11/recitations/${String(
    surahNumber
  ).padStart(3, '0')}.mp3?c=open-tarteel-d0a6`,
  duration_ms: 60_000,
  size_bytes: 500_000,
  revelation_order: surahNumber,
  revelation_place: 'Makkah',
  ayahs_count: 7,
  ayahs_timings: [],
});

const jsonResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);

const pageOf = (url: string): number => {
  try {
    return Number(new URL(url).searchParams.get('page') ?? 1);
  } catch {
    return 1;
  }
};

describe('ItqanAdapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubEnv('ITQAN_API_KEY', 'test-key');
    vi.stubEnv('NEXT_PUBLIC_APP_VERSION', '1.2.3');

    fetchMock = vi.fn((input: string) => {
      const url = String(input);
      const page = pageOf(url);

      // Track list: 3 tracks across 2 pages.
      if (/\/recitations\/\d+/.test(url)) {
        const tracks =
          page === 1 ? [makeTrack(2), makeTrack(1)] : [makeTrack(3)];
        return jsonResponse({ count: 3, results: tracks });
      }

      // Catalog: 3 recitations across 2 pages.
      const recitations =
        page === 1
          ? [
              makeRecitation(11, 2, 'بدر التركي'),
              makeRecitation(12, 3, 'ماجد الزامل'),
            ]
          : [makeRecitation(13, 4, 'حسن الدغريري')];
      return jsonResponse({ count: 3, results: recitations });
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('source', () => {
    it('is LinkSource.ITQAN', () => {
      expect(ItqanAdapter.source).toBe(LinkSource.ITQAN);
    });
  });

  describe('getReciters', () => {
    it('sends the API key and client headers', async () => {
      await ItqanAdapter.getReciters('ar');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/recitations/'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'ar',
            'X-API-Key': 'test-key',
            'X-Client-Name': 'open-tarteel',
            'X-Client-Version': '1.2.3',
          }),
        })
      );
    });

    it('omits the API key when it is not configured', async () => {
      vi.stubEnv('ITQAN_API_KEY', '');
      await ItqanAdapter.getReciters('ar');

      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['X-API-Key']).toBeUndefined();
    });

    it('sends Accept-Language: en for "en"', async () => {
      await ItqanAdapter.getReciters('en');
      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Accept-Language']).toBe('en');
    });

    it('falls back to en for locales Itqan does not support', async () => {
      await ItqanAdapter.getReciters('de');
      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Accept-Language']).toBe('en');
    });

    it('paginates the catalog instead of returning only the first page', async () => {
      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('returns one Reciter per recitation', async () => {
      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters[0]).toMatchObject({
        id: `${LinkSource.ITQAN}-2`,
        name: 'بدر التركي',
        source: LinkSource.ITQAN,
        moshaf: {
          id: '11',
          name: 'مصحف بدر التركي',
          riwaya: Riwaya.Hafs,
          surah_total: '114',
        },
      });
    });

    it('does not fetch the 114-track detail for every recitation', async () => {
      await ItqanAdapter.getReciters('ar');
      const detailCalls = fetchMock.mock.calls.filter(([url]) =>
        /\/recitations\/\d+/.test(String(url))
      );
      expect(detailCalls).toHaveLength(0);
    });

    it('returns an empty playlist so tracks load lazily', async () => {
      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters[0]?.moshaf.playlist).toEqual([]);
    });

    it('throws when the catalog endpoint fails', async () => {
      fetchMock.mockImplementation(() => jsonResponse({}, false, 500));
      await expect(ItqanAdapter.getReciters('ar')).rejects.toThrow(
        'Failed to fetch Itqan'
      );
    });
  });

  describe('getPlaylist', () => {
    it('fetches all track pages for the selected recitation', async () => {
      const playlist = await ItqanAdapter.getPlaylist('11', 'ar');
      expect(playlist).toHaveLength(3);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/recitations/11?page=1&page_size=200'),
        expect.anything()
      );
    });

    it('sorts by surah number', async () => {
      const playlist = await ItqanAdapter.getPlaylist('11', 'ar');
      expect(playlist.map((item) => item.surahId)).toEqual(['1', '2', '3']);
    });

    it('preserves the Itqan c= attribution parameter', async () => {
      const playlist = await ItqanAdapter.getPlaylist('11', 'ar');
      expect(playlist[0]?.link).toContain('c=open-tarteel-d0a6');
    });

    it('sends the localized header', async () => {
      await ItqanAdapter.getPlaylist('11', 'en');
      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
        string,
        string
      >;
      expect(headers['Accept-Language']).toBe('en');
    });

    it('throws when the track endpoint fails', async () => {
      fetchMock.mockImplementation(() => jsonResponse({}, false, 404));
      await expect(ItqanAdapter.getPlaylist('11', 'ar')).rejects.toThrow(
        'Failed to fetch Itqan'
      );
    });
  });
});
