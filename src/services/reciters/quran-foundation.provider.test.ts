import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as auth from './quran-foundation.auth';
import {
  getChapterReciters,
  getSurahTahfeezSegments,
} from './quran-foundation.provider';

vi.mock('./quran-foundation.auth', () => ({
  qfFetch: vi.fn(),
}));

describe('quran-foundation.provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChapterReciters', () => {
    it('should return reciters list on successful fetch', () => {
      const mockReciters = [{ id: 1, name: 'Mishari' }];
      vi.mocked(auth.qfFetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ reciters: mockReciters }),
      } as Response);

      return expect(getChapterReciters()).resolves.toEqual(mockReciters);
    });

    it('should throw an error if response is not ok', () => {
      vi.mocked(auth.qfFetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      return expect(getChapterReciters()).rejects.toThrow(
        'chapter_reciters failed: 500'
      );
    });
  });

  describe('getSurahTahfeezSegments', () => {
    it('should transform timestamps into TahfeezSegments correctly', async () => {
      const mockAudioFile = {
        audio_file: {
          id: 10,
          chapter_id: 1,
          audio_url: 'https://example.com/audio.mp3',
          timestamps: [
            {
              verse_key: '1:1',
              timestamp_from: 0,
              timestamp_to: 5000,
              duration: 5000,
            },
            {
              verse_key: '1:2',
              timestamp_from: 5000,
              timestamp_to: 11000,
              duration: 6000,
            },
          ],
        },
      };

      vi.mocked(auth.qfFetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAudioFile),
      } as Response);

      const segments = await getSurahTahfeezSegments(1, 1);

      expect(segments).toEqual([
        {
          surah: 1,
          ayah: 1,
          audioSource: 'https://example.com/audio.mp3',
          startMs: 0,
          endMs: 5000,
        },
        {
          surah: 1,
          ayah: 2,
          audioSource: 'https://example.com/audio.mp3',
          startMs: 5000,
          endMs: 11000,
        },
      ]);
    });

    it('should return null when timestamps are empty or missing', async () => {
      const mockAudioFile = {
        audio_file: {
          id: 10,
          chapter_id: 1,
          audio_url: 'https://example.com/audio.mp3',
          timestamps: [],
        },
      };

      vi.mocked(auth.qfFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAudioFile,
      } as Response);

      const segments = await getSurahTahfeezSegments(1, 1);
      expect(segments).toBeNull();
    });
  });
});
