import { afterEach, describe, expect, it, vi } from 'vitest';

import { Riwaya } from '@/constants';
import { LinkSource } from '@/types';

import { Mp3QuranAdapter } from './mp3quran.adapter';
import type { Mp3QuranApiResponse } from './mp3quran.types';

// ─────────────────────────────────────────────────────
// Module mocks
// ─────────────────────────────────────────────────────

vi.mock('./shared-fetch', () => ({
  retryFetch: vi.fn(),
}));

// Lazily import the mock so we can configure it per test
const { retryFetch } = await import('./shared-fetch');
const retryFetchMock = vi.mocked(retryFetch);

// ─────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────

const makeApiResponse = (
  overrides: Partial<Mp3QuranApiResponse> = {}
): Mp3QuranApiResponse => ({
  reciters: [
    {
      id: 1,
      name: 'عبد الباسط عبد الصمد',
      letter: 'ع',
      moshaf: [
        {
          id: 10,
          name: 'حفص عن عاصم',
          server: 'https://cdn.example.com/hafs/',
          surah_total: 3,
          surah_list: '1,2,3',
          moshaf_type: 1,
        },
      ],
    },
  ],
  ...overrides,
});

const makeJsonResponse = (data: unknown) =>
  ({ ok: true, json: () => Promise.resolve(data) }) as Response;

// ─────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────

describe('Mp3QuranAdapter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('source', () => {
    it('is LinkSource.MP3QURAN', () => {
      expect(Mp3QuranAdapter.source).toBe(LinkSource.MP3QURAN);
    });
  });

  describe('getReciters', () => {
    it('calls the API with language=ar by default', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      await Mp3QuranAdapter.getReciters('ar');
      expect(retryFetchMock).toHaveBeenCalledWith(
        expect.stringContaining('language=ar')
      );
    });

    it('calls the API with language=eng for the "en" locale', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      await Mp3QuranAdapter.getReciters('en');
      expect(retryFetchMock).toHaveBeenCalledWith(
        expect.stringContaining('language=eng')
      );
    });

    it('returns one Reciter per moshaf', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const reciters = await Mp3QuranAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
    });

    it('returns multiple Reciters when a reciter has multiple moshafs', async () => {
      const apiResponse = makeApiResponse({
        reciters: [
          {
            id: 1,
            name: 'عبد الباسط',
            letter: 'ع',
            moshaf: [
              {
                id: 10,
                name: 'حفص عن عاصم',
                server: 'https://cdn.example.com/hafs/',
                surah_total: 2,
                surah_list: '1,2',
                moshaf_type: 1,
              },
              {
                id: 11,
                name: 'ورش عن نافع',
                server: 'https://cdn.example.com/warsh/',
                surah_total: 2,
                surah_list: '1,2',
                moshaf_type: 2,
              },
            ],
          },
        ],
      });
      retryFetchMock.mockResolvedValue(makeJsonResponse(apiResponse));
      const reciters = await Mp3QuranAdapter.getReciters('ar');
      expect(reciters).toHaveLength(2);
    });

    it('builds a source-prefixed string ID', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.id).toBe(`${LinkSource.MP3QURAN}-1`);
    });

    it('sets source to LinkSource.MP3QURAN', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.source).toBe(LinkSource.MP3QURAN);
    });

    it('maps name correctly', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.name).toBe('عبد الباسط عبد الصمد');
    });

    it('maps moshaf id as a string', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.moshaf.id).toBe('10');
    });

    it('maps surah_total as a string', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.moshaf.surah_total).toBe('3');
    });

    it('resolves riwaya correctly from moshaf name', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.moshaf.riwaya).toBe(Riwaya.Hafs);
    });

    it('builds a playlist with correct links', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse(makeApiResponse()));
      const [reciter] = await Mp3QuranAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist).toEqual([
        { surahId: '1', link: 'https://cdn.example.com/hafs/001.mp3' },
        { surahId: '2', link: 'https://cdn.example.com/hafs/002.mp3' },
        { surahId: '3', link: 'https://cdn.example.com/hafs/003.mp3' },
      ]);
    });

    it('returns an empty array when the API returns no reciters', async () => {
      retryFetchMock.mockResolvedValue(makeJsonResponse({ reciters: [] }));
      const reciters = await Mp3QuranAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('propagates errors thrown by retryFetch', async () => {
      retryFetchMock.mockRejectedValue(new Error('Network failure'));
      await expect(Mp3QuranAdapter.getReciters('ar')).rejects.toThrow(
        'Network failure'
      );
    });
  });
});
