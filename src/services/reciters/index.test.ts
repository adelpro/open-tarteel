import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

// ─────────────────────────────────────────────────────
// Module mocks – must be declared before imports of the
// modules under test so Vitest can hoist them.
// ─────────────────────────────────────────────────────

vi.mock('./mp3quran.adapter', () => ({
  Mp3QuranAdapter: { source: LinkSource.MP3QURAN, getReciters: vi.fn() },
}));

vi.mock('./itqan.adapter', () => ({
  ItqanAdapter: { source: LinkSource.ITQAN, getReciters: vi.fn() },
}));

vi.mock('./quranai.adapter', () => ({
  QuranAiAdapter: { source: LinkSource.QURANAI, getReciters: vi.fn() },
  getAyahAudioRange: vi.fn(),
  validateAyahRange: vi.fn(),
}));

vi.mock('./quranfoundation.adapter', () => ({
  QuranFoundationAdapter: {
    source: LinkSource.QURAN_FOUNDATION,
    getReciters: vi.fn(),
  },
}));

const { getAllRecitersFromAdapters, parseEnabledSources } =
  await import('./index');

const { Mp3QuranAdapter } = await import('./mp3quran.adapter');
const { ItqanAdapter } = await import('./itqan.adapter');
const { QuranAiAdapter } = await import('./quranai.adapter');
const { QuranFoundationAdapter } = await import('./quranfoundation.adapter');

const mp3Mock = vi.mocked(Mp3QuranAdapter.getReciters);
const itqanMock = vi.mocked(ItqanAdapter.getReciters);
const quranaiMock = vi.mocked(QuranAiAdapter.getReciters);
const quranFoundationMock = vi.mocked(QuranFoundationAdapter.getReciters);

// ─────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────

const makeReciter = (id: string, source: LinkSource): Reciter => ({
  id,
  name: `Reciter ${id}`,
  source,
  moshaf: {
    id: '1',
    name: 'Test Moshaf',
    riwaya: Riwaya.Hafs,
    server: 'https://example.com/',
    surah_total: '3',
    playlist: [
      { surahId: '1', link: 'https://example.com/001.mp3' },
      { surahId: '2', link: 'https://example.com/002.mp3' },
      { surahId: '3', link: 'https://example.com/003.mp3' },
    ],
  },
});

const mp3Reciter = makeReciter(`${LinkSource.MP3QURAN}-1`, LinkSource.MP3QURAN);

const itqanReciter = makeReciter(`${LinkSource.ITQAN}-10`, LinkSource.ITQAN);

const quranaiReciter = makeReciter(
  `${LinkSource.QURANAI}-ar.ibrahimakhdar.hafs`,
  LinkSource.QURANAI
);

const quranFoundationReciter = makeReciter(
  `${LinkSource.QURAN_FOUNDATION}-7`,
  LinkSource.QURAN_FOUNDATION
);

// ─────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────

describe('getAllRecitersFromAdapters', () => {
  beforeEach(() => {
    mp3Mock.mockResolvedValue([]);
    itqanMock.mockResolvedValue([]);
    quranaiMock.mockResolvedValue([]);
    quranFoundationMock.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns combined results from all adapters', async () => {
    mp3Mock.mockResolvedValue([mp3Reciter]);
    itqanMock.mockResolvedValue([itqanReciter]);
    quranaiMock.mockResolvedValue([quranaiReciter]);
    quranFoundationMock.mockResolvedValue([quranFoundationReciter]);

    const result = await getAllRecitersFromAdapters('ar');

    expect(result).toHaveLength(4);
    expect(result).toContainEqual(mp3Reciter);
    expect(result).toContainEqual(itqanReciter);
    expect(result).toContainEqual(quranaiReciter);
    expect(result).toContainEqual(quranFoundationReciter);
  });

  it('passes the lang argument to each adapter', async () => {
    await getAllRecitersFromAdapters('en');

    expect(mp3Mock).toHaveBeenCalledWith('en');
    expect(itqanMock).toHaveBeenCalledWith('en');
    expect(quranaiMock).toHaveBeenCalledWith('en');
    expect(quranFoundationMock).toHaveBeenCalledWith('en');
  });

  it('defaults lang to "ar" when not provided', async () => {
    await getAllRecitersFromAdapters();

    expect(mp3Mock).toHaveBeenCalledWith('ar');
    expect(itqanMock).toHaveBeenCalledWith('ar');
    expect(quranaiMock).toHaveBeenCalledWith('ar');
    expect(quranFoundationMock).toHaveBeenCalledWith('ar');
  });

  it('still returns results from a working adapter when one adapter fails', async () => {
    mp3Mock.mockRejectedValue(new Error('mp3quran down'));
    itqanMock.mockResolvedValue([itqanReciter]);

    const result = await getAllRecitersFromAdapters('ar');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(itqanReciter);
  });

  it('returns an empty array when all adapters fail', async () => {
    mp3Mock.mockRejectedValue(new Error('mp3quran down'));
    itqanMock.mockRejectedValue(new Error('itqan down'));
    quranaiMock.mockRejectedValue(new Error('qurani.ai down'));
    quranFoundationMock.mockRejectedValue(new Error('quran.foundation down'));

    const result = await getAllRecitersFromAdapters('ar');

    expect(result).toEqual([]);
  });

  it('returns an empty array when all adapters return empty lists', async () => {
    const result = await getAllRecitersFromAdapters('ar');

    expect(result).toEqual([]);
  });

  it('calls all adapters in parallel (all called regardless of each other)', async () => {
    mp3Mock.mockResolvedValue([mp3Reciter]);
    itqanMock.mockResolvedValue([itqanReciter]);
    quranaiMock.mockResolvedValue([quranaiReciter]);
    quranFoundationMock.mockResolvedValue([quranFoundationReciter]);

    await getAllRecitersFromAdapters('ar');

    expect(mp3Mock).toHaveBeenCalledTimes(1);
    expect(itqanMock).toHaveBeenCalledTimes(1);
    expect(quranaiMock).toHaveBeenCalledTimes(1);
    expect(quranFoundationMock).toHaveBeenCalledTimes(1);
  });

  it('preserves registration order: mp3quran, itqan, qurani.ai, quran.foundation', async () => {
    mp3Mock.mockResolvedValue([mp3Reciter]);
    itqanMock.mockResolvedValue([itqanReciter]);
    quranaiMock.mockResolvedValue([quranaiReciter]);
    quranFoundationMock.mockResolvedValue([quranFoundationReciter]);

    const result = await getAllRecitersFromAdapters('ar');

    expect(result).toHaveLength(4);
    expect(result[0].source).toBe(LinkSource.MP3QURAN);
    expect(result[1].source).toBe(LinkSource.ITQAN);
    expect(result[2].source).toBe(LinkSource.QURANAI);
    expect(result[3].source).toBe(LinkSource.QURAN_FOUNDATION);
  });

  it('when enabledSources provided, only fetches from those adapters', async () => {
    mp3Mock.mockResolvedValue([mp3Reciter]);

    const result = await getAllRecitersFromAdapters('ar', [
      LinkSource.MP3QURAN,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mp3Reciter);

    expect(mp3Mock).toHaveBeenCalledWith('ar');
    expect(itqanMock).not.toHaveBeenCalled();
    expect(quranaiMock).not.toHaveBeenCalled();
    expect(quranFoundationMock).not.toHaveBeenCalled();
  });

  it('when only QURANAI enabled, only fetches from the quranai adapter', async () => {
    quranaiMock.mockResolvedValue([quranaiReciter]);

    const result = await getAllRecitersFromAdapters('ar', [LinkSource.QURANAI]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(quranaiReciter);

    expect(quranaiMock).toHaveBeenCalledWith('ar');
    expect(mp3Mock).not.toHaveBeenCalled();
    expect(itqanMock).not.toHaveBeenCalled();
    expect(quranFoundationMock).not.toHaveBeenCalled();
  });

  it('when only QURAN_FOUNDATION enabled, only fetches from the quran foundation adapter', async () => {
    quranFoundationMock.mockResolvedValue([quranFoundationReciter]);

    const result = await getAllRecitersFromAdapters('ar', [
      LinkSource.QURAN_FOUNDATION,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(quranFoundationReciter);

    expect(quranFoundationMock).toHaveBeenCalledWith('ar');
    expect(mp3Mock).not.toHaveBeenCalled();
    expect(itqanMock).not.toHaveBeenCalled();
    expect(quranaiMock).not.toHaveBeenCalled();
  });
});

describe('parseEnabledSources', () => {
  it('parses comma-separated source string', () => {
    expect(parseEnabledSources('mp3quran.net,itqan.dev')).toEqual([
      LinkSource.MP3QURAN,
      LinkSource.ITQAN,
    ]);
  });

  it('returns undefined for empty or invalid input', () => {
    expect(parseEnabledSources('')).toBeUndefined();
    expect(parseEnabledSources(null)).toBeUndefined();
    expect(parseEnabledSources(undefined)).toBeUndefined();
  });

  it('filters out invalid source values', () => {
    expect(parseEnabledSources('mp3quran.net,invalid,itqan.dev')).toEqual([
      LinkSource.MP3QURAN,
      LinkSource.ITQAN,
    ]);
  });

  it('parses qurani.ai as a valid source value', () => {
    expect(parseEnabledSources('qurani.ai,itqan.dev')).toEqual([
      LinkSource.QURANAI,
      LinkSource.ITQAN,
    ]);
  });

  it('parses qurani.ai on its own', () => {
    expect(parseEnabledSources('qurani.ai')).toEqual([LinkSource.QURANAI]);
  });

  it('parses qurani.ai alongside mp3quran and itqan', () => {
    expect(parseEnabledSources('mp3quran.net,qurani.ai,itqan.dev')).toEqual([
      LinkSource.MP3QURAN,
      LinkSource.QURANAI,
      LinkSource.ITQAN,
    ]);
  });

  it('preserves duplicate source values', () => {
    expect(parseEnabledSources('qurani.ai,mp3quran.net,qurani.ai')).toEqual([
      LinkSource.QURANAI,
      LinkSource.MP3QURAN,
      LinkSource.QURANAI,
    ]);
  });

  it('parses quran.foundation as a valid source', () => {
    expect(parseEnabledSources('mp3quran.net,quran.foundation')).toEqual([
      LinkSource.MP3QURAN,
      LinkSource.QURAN_FOUNDATION,
    ]);
  });
});
