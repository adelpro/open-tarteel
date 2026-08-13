import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LinkSource, Riwaya } from '@/types';

import {
  QuranFoundationAdapter,
  resetQuranFoundationCache,
} from './quranfoundation.adapter';
import type {
  QuranFoundationChapterAudioResponse,
  QuranFoundationChapterRecitersResponse,
} from './quranfoundation.types';

// Fixtures (mirror the live quran.foundation v4-aligned API)

const makeChapterRecitersResponse =
  (): QuranFoundationChapterRecitersResponse => ({
    reciters: [
      {
        id: 7,
        name: 'Mishari Rashid al-`Afasy',
        style: {
          name: 'Murattal',
          translated_name: { name: 'Murattal', language_name: 'english' },
        },
        qirat: { name: 'Hafs', language_name: 'english' },
        translated_name: {
          name: 'Mishari Rashid al-`Afasy',
          language_name: 'english',
        },
      },
    ],
  });

const makeChapterAudioResponse = (): QuranFoundationChapterAudioResponse => ({
  audio_files: [
    {
      id: 1001,
      chapter_id: 2,
      file_size: 2048.0,
      format: 'mp3',
      audio_url:
        'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/2.mp3',
    },
    {
      id: 1000,
      chapter_id: 1,
      file_size: 371.65,
      format: 'mp3',
      audio_url:
        'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/1.mp3',
    },
    {
      id: 1002,
      chapter_id: 3,
      file_size: 110_221_440.0,
      format: 'mp3',
      audio_url:
        'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/3.mp3',
    },
  ],
});

const makeFetchResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);

// Tests

describe('QuranFoundationAdapter', () => {
  beforeEach(() => {
    vi.stubEnv('QURAN_FOUNDATION_CLIENT_ID', 'test-client-id');
    vi.stubEnv('QURAN_FOUNDATION_CLIENT_SECRET', 'test-client-secret');
    // Disable request pacing so unit tests run fast.
    vi.stubEnv('QURAN_FOUNDATION_RATE_LIMIT_MS', '0');
    resetQuranFoundationCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('chapter_recitations')) {
          return makeFetchResponse(makeChapterAudioResponse());
        }
        if (url.includes('chapter_reciters')) {
          return makeFetchResponse(makeChapterRecitersResponse());
        }
        // token endpoint
        return makeFetchResponse({
          access_token: 'test-access-token',
          expires_in: 3600,
          scope: 'content',
        });
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('source', () => {
    it('is LinkSource.QURAN_FOUNDATION', () => {
      expect(QuranFoundationAdapter.source).toBe(LinkSource.QURAN_FOUNDATION);
    });
  });

  describe('getReciters', () => {
    it('throws when client credentials are not configured', async () => {
      vi.stubEnv('QURAN_FOUNDATION_CLIENT_ID', '');
      await expect(QuranFoundationAdapter.getReciters('ar')).rejects.toThrow(
        'QURAN_FOUNDATION_CLIENT_ID'
      );
    });

    it('exchanges client credentials for an access token first', async () => {
      await QuranFoundationAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/oauth2/token'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      );
    });

    it('reuses a cached token on the next invocation', async () => {
      await QuranFoundationAdapter.getReciters('ar');
      await QuranFoundationAdapter.getReciters('en');
      const tokenCalls = vi
        .mocked(fetch)
        .mock.calls.filter(([url]) => String(url).includes('/oauth2/token'));
      expect(tokenCalls).toHaveLength(1);
    });

    it('sends x-auth-token and x-client-id on content requests', async () => {
      await QuranFoundationAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('chapter_reciters'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-auth-token': 'test-access-token',
            'x-client-id': 'test-client-id',
          }),
        })
      );
    });

    it('fetches chapter audio for each reciter', async () => {
      await QuranFoundationAdapter.getReciters('ar');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('chapter_recitations/7'),
        expect.anything()
      );
    });

    it('returns one Reciter per chapter reciter', async () => {
      const reciters = await QuranFoundationAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
    });

    it('builds a source-prefixed string ID from the reciter id', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.id).toBe(`${LinkSource.QURAN_FOUNDATION}-7`);
    });

    it('sets source to LinkSource.QURAN_FOUNDATION', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.source).toBe(LinkSource.QURAN_FOUNDATION);
    });

    it('maps the reciter name from translated_name', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.name).toBe('Mishari Rashid al-`Afasy');
    });

    it('maps moshaf id to the reciter id string', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.id).toBe('7');
    });

    it('resolves riwaya from qirat.name', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.riwaya).toBe(Riwaya.Hafs);
    });

    it('defaults riwaya to Hafs when qirat is missing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('chapter_recitations')) {
            return makeFetchResponse(makeChapterAudioResponse());
          }
          if (url.includes('chapter_reciters')) {
            return makeFetchResponse({
              reciters: [
                {
                  id: 7,
                  name: 'Some Reciter',
                  translated_name: {
                    name: 'Some Reciter',
                    language_name: 'english',
                  },
                },
              ],
            });
          }
          return makeFetchResponse({ access_token: 't', expires_in: 3600 });
        })
      );
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.riwaya).toBe(Riwaya.Hafs);
    });

    it('sorts and builds a playlist from audio_files', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.playlist).toEqual([
        {
          surahId: '1',
          link: 'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/1.mp3',
        },
        {
          surahId: '2',
          link: 'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/2.mp3',
        },
        {
          surahId: '3',
          link: 'https://download.quranicaudio.com/qdc/mishari_rashid_alafasy/murattal/3.mp3',
        },
      ]);
    });

    it('sets surah_total to the playlist length as a string', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.surah_total).toBe('3');
    });

    it('sets server to an empty string', async () => {
      const [reciter] = await QuranFoundationAdapter.getReciters('ar');
      expect(reciter.moshaf.server).toBe('');
    });

    it('throws when the token exchange fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: vi.fn(),
        } as unknown as Response)
      );
      await expect(QuranFoundationAdapter.getReciters('ar')).rejects.toThrow(
        'access token'
      );
    });

    it('throws when the reciters list endpoint keeps failing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/oauth2/token')) {
            return makeFetchResponse({ access_token: 't', expires_in: 3600 });
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: vi.fn(),
          } as unknown as Response);
        })
      );
      await expect(QuranFoundationAdapter.getReciters('ar')).rejects.toThrow(
        'HTTP 500'
      );
    });

    it('skips a reciter when its chapter audio fetch fails', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/oauth2/token')) {
            return makeFetchResponse({ access_token: 't', expires_in: 3600 });
          }
          if (url.includes('chapter_reciters')) {
            return makeFetchResponse(makeChapterRecitersResponse());
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: vi.fn(),
          } as unknown as Response);
        })
      );

      const reciters = await QuranFoundationAdapter.getReciters('ar');
      expect(reciters).toHaveLength(0);
    });

    it('returns results from successful reciters even when some fail', async () => {
      const twoReciters: QuranFoundationChapterRecitersResponse = {
        reciters: [
          ...makeChapterRecitersResponse().reciters,
          {
            id: 9,
            name: 'Warsh Reciter',
            qirat: { name: 'Warsh', language_name: 'english' },
            translated_name: {
              name: 'Warsh Reciter',
              language_name: 'english',
            },
          },
        ],
      };

      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/oauth2/token')) {
            return makeFetchResponse({ access_token: 't', expires_in: 3600 });
          }
          if (url.includes('chapter_reciters')) {
            return makeFetchResponse(twoReciters);
          }
          if (url.includes('chapter_recitations/7')) {
            return makeFetchResponse(makeChapterAudioResponse());
          }
          return Promise.resolve({
            ok: false,
            status: 500,
            json: vi.fn(),
          } as unknown as Response);
        })
      );

      const reciters = await QuranFoundationAdapter.getReciters('ar');
      expect(reciters).toHaveLength(1);
      expect(reciters[0].id).toBe(`${LinkSource.QURAN_FOUNDATION}-7`);
    });

    it('returns an empty array when the reciters list is empty', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/oauth2/token')) {
            return makeFetchResponse({ access_token: 't', expires_in: 3600 });
          }
          return makeFetchResponse({ reciters: [] });
        })
      );
      const reciters = await QuranFoundationAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('skips reciters with no name', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          if (url.includes('/oauth2/token')) {
            return makeFetchResponse({ access_token: 't', expires_in: 3600 });
          }
          if (url.includes('chapter_recitations')) {
            return makeFetchResponse(makeChapterAudioResponse());
          }
          return makeFetchResponse({
            reciters: [{ id: 3, name: '' }],
          });
        })
      );

      const reciters = await QuranFoundationAdapter.getReciters('ar');
      expect(reciters).toEqual([]);
    });

    it('serializes concurrent invocations through one queue', async () => {
      const results = await Promise.all([
        QuranFoundationAdapter.getReciters('ar'),
        QuranFoundationAdapter.getReciters('en'),
      ]);
      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(1);
      // First run (ar): token + list + audio; second run (en) reuses the cached token.
      expect(fetch).toHaveBeenCalledTimes(5);
    });
  });
});
