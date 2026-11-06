import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Moshaf } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import { Mp3QuranV4Adapter } from './mp3quran-v4.adapter';
import type { Mp3QuranV4Recitation } from './mp3quran-v4.types';

vi.mock('./shared-fetch', () => ({ retryFetch: vi.fn() }));

const { retryFetch } = await import('./shared-fetch');
const retryFetchMock = vi.mocked(retryFetch);

const makeRecitation = (
  id: number,
  code: string,
  riwayahCode: string
): Mp3QuranV4Recitation => ({
  id,
  reciter: { id, code, name: `Reciter ${code}` },
  riwayahs: [{ code: riwayahCode, qiraah: 'asim', name: 'Hafs an Asim' }],
  qiraahs: ['asim'],
  code: `${code}/r1`,
  tariq: null,
  wajh: null,
  style: 'murattal',
  has_ayah_timings: true,
  coverage: { complete: true, surahs: [1, 2, 3] },
  total_duration_ms: 1000,
  audio: {
    base: `https://cdn.mp3quran.net/audio/${code}/r1/`,
    files: {
      original: '{surah:03d}.mp3',
      mp3_64: '{surah:03d}-64k.mp3',
      opus_48: '{surah:03d}.opus',
    },
  },
});

const response = (data: unknown[]): Response =>
  ({
    ok: true,
    json: () => Promise.resolve({ data, links: {} }),
  }) as Response;

describe('Mp3QuranV4Adapter', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MP3QURAN_V4', 'true');
    retryFetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('maps v4 recitations and stores compact playlist data', async () => {
    retryFetchMock.mockResolvedValueOnce(
      response([makeRecitation(1, 'ibrahim-akhdar', 'hafs_an_asim')])
    );

    const [reciter] = await Mp3QuranV4Adapter.getReciters('en');

    expect(reciter.source).toBe(LinkSource.MP3QURAN_V4);
    expect(reciter.id).toBe(`${LinkSource.MP3QURAN_V4}-ibrahim-akhdar`);
    expect(reciter.moshaf).toMatchObject({
      id: '1',
      riwaya: Riwaya.Hafs,
      server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
      surah_total: '3',
      surahIds: '1,2,3',
      recitationCode: 'ibrahim-akhdar/r1',
      hasTimings: true,
      playlist: [],
    });
    expect(retryFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('locale=en')
    );
  });

  it('follows cursor pagination', async () => {
    retryFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [makeRecitation(1, 'a', 'hafs_an_asim')],
            links: { next: '/v4/recitations?cursor=x' },
          }),
      } as Response)
      .mockResolvedValueOnce(
        response([makeRecitation(2, 'b', 'warsh_an_nafi')])
      );

    const reciters = await Mp3QuranV4Adapter.getReciters('ar');

    expect(reciters).toHaveLength(2);
    expect(reciters[1]?.moshaf.riwaya).toBe(Riwaya.Warsh);
    expect(retryFetchMock).toHaveBeenCalledTimes(2);
  });

  it('builds playlists from server + surah ids', async () => {
    const playlist = await Mp3QuranV4Adapter.getPlaylist({
      id: '1',
      server: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/',
      surahIds: '1,2',
    } as Moshaf);

    expect(playlist).toEqual([
      {
        surahId: '1',
        link: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/001.mp3',
      },
      {
        surahId: '2',
        link: 'https://cdn.mp3quran.net/audio/ibrahim-akhdar/r1/002.mp3',
      },
    ]);
  });

  it('returns no reciters when the flag is off', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_MP3QURAN_V4', 'false');
    await expect(Mp3QuranV4Adapter.getReciters('ar')).resolves.toEqual([]);
    expect(retryFetchMock).not.toHaveBeenCalled();
  });
});
