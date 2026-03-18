import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

// ─────────────────────────────────────────────────────
// Mock the service layer so no real network calls happen
// ─────────────────────────────────────────────────────

vi.mock('@/services/reciters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/reciters')>();
  return {
    ...actual,
    getAllRecitersFromAdapters: vi.fn(),
  };
});

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  }),
}));

const { getAllRecitersFromAdapters } = await import('@/services/reciters');
const serviceMock = vi.mocked(getAllRecitersFromAdapters);

// Import after mocks are in place
const { getAllReciters, getReciter } = await import('@/utils/api');

// ─────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────

const makeReciter = (id: string): Reciter => ({
  id,
  name: `Reciter ${id}`,
  source: LinkSource.MP3QURAN,
  moshaf: {
    id: '42',
    name: 'حفص عن عاصم',
    riwaya: Riwaya.Hafs,
    server: 'https://cdn.example.com/',
    surah_total: '3',
    playlist: [
      { surahId: '1', link: 'https://cdn.example.com/001.mp3' },
      { surahId: '2', link: 'https://cdn.example.com/002.mp3' },
      { surahId: '3', link: 'https://cdn.example.com/003.mp3' },
    ],
  },
});

const reciterA = makeReciter('mp3quran.net-1');
const reciterB = makeReciter('mp3quran.net-2');

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

/** Simulate server-side (no window). */
const runAsServer = async <T>(function_: () => Promise<T>): Promise<T> => {
  const original = globalThis.window;
  // @ts-expect-error – intentionally removing window to simulate SSR
  delete globalThis.window;
  try {
    return await function_();
  } finally {
    globalThis.window = original;
  }
};

const makeJsonFetch = (data: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(data),
  } as Response);

// ─────────────────────────────────────────────────────
// getAllReciters
// ─────────────────────────────────────────────────────

describe('getAllReciters', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('server-side (window is undefined)', () => {
    it('calls the service layer directly', async () => {
      serviceMock.mockResolvedValue([reciterA, reciterB]);

      const result = await runAsServer(() => getAllReciters('ar'));

      expect(serviceMock).toHaveBeenCalledWith('ar', null);
      expect(result).toEqual([reciterA, reciterB]);
    });

    it('passes locale "en" to the service', async () => {
      serviceMock.mockResolvedValue([]);

      await runAsServer(() => getAllReciters('en'));

      expect(serviceMock).toHaveBeenCalledWith('en', null);
    });

    it('defaults locale to "ar"', async () => {
      serviceMock.mockResolvedValue([]);

      await runAsServer(() => getAllReciters());

      expect(serviceMock).toHaveBeenCalledWith('ar', null);
    });
  });

  describe('client-side (window is defined)', () => {
    it('calls the /api/reciters route with language=ar', async () => {
      vi.stubGlobal('fetch', makeJsonFetch([reciterA]));

      const result = await getAllReciters('ar');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reciters?language=ar'),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
      expect(result).toEqual([reciterA]);
    });

    it('calls the /api/reciters route with language=eng for "en"', async () => {
      vi.stubGlobal('fetch', makeJsonFetch([reciterA]));

      await getAllReciters('en');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('language=eng'),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
    });

    it('throws when the API response is not ok', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(null, false));

      await expect(getAllReciters('ar')).rejects.toThrow(
        'Failed to fetch reciters'
      );
    });

    it('does NOT call the service layer', async () => {
      vi.stubGlobal('fetch', makeJsonFetch([]));

      await getAllReciters('ar');

      expect(serviceMock).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────
// getReciter
// ─────────────────────────────────────────────────────

describe('getReciter', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('server-side', () => {
    it('returns the matching reciter by id and moshafId', async () => {
      serviceMock.mockResolvedValue([reciterA, reciterB]);

      const result = await runAsServer(() =>
        getReciter('mp3quran.net-1', '42', 'ar')
      );

      expect(result).toEqual(reciterA);
    });

    it('returns undefined when no reciter matches', async () => {
      serviceMock.mockResolvedValue([reciterA]);

      const result = await runAsServer(() =>
        getReciter('mp3quran.net-99', '42', 'ar')
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined when the moshafId does not match', async () => {
      serviceMock.mockResolvedValue([reciterA]);

      const result = await runAsServer(() =>
        getReciter('mp3quran.net-1', '999', 'ar')
      );

      expect(result).toBeUndefined();
    });
  });

  describe('client-side', () => {
    it('calls the /api/reciters/:id/:moshafId route', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(reciterA));

      const result = await getReciter('mp3quran.net-1', '42', 'ar');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reciters/'),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
      expect(result).toEqual(reciterA);
    });

    it('URL-encodes the id and moshafId', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(reciterA));

      await getReciter('mp3quran.net-1', '42', 'ar');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('mp3quran.net-1')),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
    });

    it('passes language=eng for "en" locale', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(reciterA));

      await getReciter('mp3quran.net-1', '42', 'en');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('language=eng'),
        expect.objectContaining({
          next: { revalidate: 3600 },
        })
      );
    });

    it('returns undefined when the API responds with non-ok', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(null, false));

      const result = await getReciter('mp3quran.net-1', '42', 'ar');

      expect(result).toBeUndefined();
    });

    it('does NOT call the service layer', async () => {
      vi.stubGlobal('fetch', makeJsonFetch(reciterA));

      await getReciter('mp3quran.net-1', '42', 'ar');

      expect(serviceMock).not.toHaveBeenCalled();
    });
  });
});
