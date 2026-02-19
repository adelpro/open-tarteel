import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, Riwaya } from '@/types';

import { ItqanAdapter } from './itqan.adapter';
import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
} from './itqan.types';

// ─────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────

const makeRecitationsResponse = (): ItqanRecitationResponse => ({
  results: [
    {
      id: 5,
      name: 'Hafs An Asim',
      description: '',
      publisher: { id: 1, name: 'Itqan' },
      reciter: { id: 10, name: 'Abdul Basit' },
      riwayah: { id: 1, name: 'حفص عن عاصم' },
      surahs_count: 3,
    },
  ],
});

const makeDetailResponse = (): ItqanRecitationDetailResponse => ({
  count: 3,
  results: [
    {
      surah_number: 1,
      surah_name: 'الفاتحة',
      surah_name_en: 'Al-Fatihah',
      audio_url: 'https://cdn.itqan.dev/1.mp3',
      duration_ms: 60_000,
      size_bytes: 500_000,
      revelation_order: 5,
      revelation_place: 'makkah',
      ayahs_count: 7,
      ayahs_timings: [],
    },
    {
      surah_number: 2,
      surah_name: 'البقرة',
      surah_name_en: 'Al-Baqarah',
      audio_url: 'https://cdn.itqan.dev/2.mp3',
      duration_ms: 9000,
      size_bytes: 8_000_000,
      revelation_order: 87,
      revelation_place: 'madinah',
      ayahs_count: 286,
      ayahs_timings: [],
    },
    {
      surah_number: 3,
      surah_name: 'آل عمران',
      surah_name_en: 'Aal Imran',
      audio_url: 'https://cdn.itqan.dev/3.mp3',
      duration_ms: 7000,
      size_bytes: 6_000_000,
      revelation_order: 89,
      revelation_place: 'madinah',
      ayahs_count: 200,
      ayahs_timings: [],
    },
  ],
});

const makeFetchResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  } as Response);

// ─────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────

describe('ItqanAdapter', () => {
  beforeEach(() => {
    // Default: list endpoint → recitations, detail endpoint → surahs
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('/recitations/')) {
          return makeFetchResponse(makeRecitationsResponse());
        }
        // detail endpoint: /recitations/:id
        return makeFetchResponse(makeDetailResponse());
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('source', () => {
    it('is LinkSource.ITQAN', () => {
      expect(ItqanAdapter.source).toBe(LinkSource.ITQAN);
    });
  });

  describe('getReciters', () => {
    it('fetches the recitations list first', async () => {
      await ItqanAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recitations/')
      );
    });

    it('fetches a detail endpoint for each recitation', async () => {
      await ItqanAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/recitations/5')
      );
    });

    it('returns one Reciter per recitation', async () => {
      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
    });

    it('builds a source-prefixed string ID from reciter.id', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.id).toBe(`${LinkSource.ITQAN}-10`);
    });

    it('sets source to LinkSource.ITQAN', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.source).toBe(LinkSource.ITQAN);
    });

    it('maps the reciter name', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.name).toBe('Abdul Basit');
    });

    it('maps moshaf id to the recitation id string', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.moshaf.id).toBe('5');
    });

    it('resolves riwaya from the riwayah name', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.moshaf.riwaya).toBe(Riwaya.Hafs);
    });

    it('builds a playlist from the detail response', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist).toEqual([
        { surahId: '1', link: 'https://cdn.itqan.dev/1.mp3' },
        { surahId: '2', link: 'https://cdn.itqan.dev/2.mp3' },
        { surahId: '3', link: 'https://cdn.itqan.dev/3.mp3' },
      ]);
    });

    it('sets surah_total to the playlist length as a string', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.moshaf.surah_total).toBe('3');
    });

    it('sets server to an empty string', async () => {
      const [reciter] = await ItqanAdapter.getReciters('ar');
      expect(reciter.moshaf.server).toBe('');
    });

    it('throws when the recitations list endpoint returns a non-ok response', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue({
            ok: false,
            json: vi.fn(),
          } as unknown as Response)
      );
      await expect(ItqanAdapter.getReciters('ar')).rejects.toThrow(
        'Failed to fetch Itqan recitations'
      );
    });

    it('skips a recitation when its detail endpoint returns non-ok', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.endsWith('/recitations/')) {
            return makeFetchResponse(makeRecitationsResponse());
          }
          // detail endpoint fails
          return Promise.resolve({
            ok: false,
            json: vi.fn(),
          } as unknown as Response);
        })
      );

      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toHaveLength(0);
    });

    it('skips a recitation when its detail fetch throws', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.endsWith('/recitations/')) {
            return makeFetchResponse(makeRecitationsResponse());
          }
          return Promise.reject(new Error('Network error'));
        })
      );

      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toHaveLength(0);
    });

    it('returns results from successful recitations even when some fail', async () => {
      const twoRecitations: ItqanRecitationResponse = {
        results: [
          ...makeRecitationsResponse().results,
          {
            id: 6,
            name: 'Warsh An Nafi',
            description: '',
            publisher: { id: 1, name: 'Itqan' },
            reciter: { id: 20, name: 'Nafi Reciter' },
            riwayah: { id: 2, name: 'ورش عن نافع' },
            surahs_count: 3,
          },
        ],
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.endsWith('/recitations/')) {
            return makeFetchResponse(twoRecitations);
          }
          if (url.endsWith('/recitations/5')) {
            return makeFetchResponse(makeDetailResponse());
          }
          // recitation 6 detail fails
          return Promise.resolve({
            ok: false,
            json: vi.fn(),
          } as unknown as Response);
        })
      );

      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
      expect(reciters[0].id).toBe(`${LinkSource.ITQAN}-10`);
    });

    it('returns an empty array when recitations list is empty', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        } as Response)
      );
      const reciters = await ItqanAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });
  });
});
