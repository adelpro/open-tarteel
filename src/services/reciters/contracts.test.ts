import { describe, expect, it } from 'vitest';

import type { Reciter } from '@/types';

import { mp3QuranV3Timings } from '../timings/mp3quran-v3.timings';
import { quranAiTimings } from '../timings/qurani.timings';
import { ItqanAdapter } from './itqan.adapter';
import { Mp3QuranAdapter } from './mp3quran.adapter';
import { QuranAiAdapter } from './quranai.adapter';
import { QuranFoundationAdapter } from './quranfoundation.adapter';

/**
 * Opt-in contract tests that call real provider APIs.
 *
 * Run locally with LIVE_PROVIDER_TESTS=1; the weekly workflow runs them with
 * repository secrets. They are skipped in pull-request CI.
 */
const live = process.env.LIVE_PROVIDER_TESTS === '1';

const TIMEOUT = 90_000;

function expectListContract(reciters: Reciter[]) {
  expect(reciters.length).toBeGreaterThan(0);

  for (const reciter of reciters.slice(0, 5)) {
    expect(reciter.id).toBeTruthy();
    expect(reciter.name).toBeTruthy();
    expect(reciter.source).toBeTruthy();
    expect(reciter.moshaf.id).toBeTruthy();
    expect(reciter.moshaf.name).toBeTruthy();
    expect(Array.isArray(reciter.moshaf.playlist)).toBe(true);
    expect(reciter.moshaf.playlist).toHaveLength(0);
  }
}

describe.skipIf(!live)('live provider contracts', () => {
  it(
    'MP3Quran v3 list shape',
    async () => {
      expectListContract(await Mp3QuranAdapter.getReciters('en'));
    },
    TIMEOUT
  );

  it(
    'Itqan list shape',
    async () => {
      expectListContract(await ItqanAdapter.getReciters('en'));
    },
    TIMEOUT
  );

  it(
    'Qurani.ai list shape',
    async () => {
      expectListContract(await QuranAiAdapter.getReciters('en'));
    },
    TIMEOUT
  );

  it(
    'Quran Foundation list shape',
    async () => {
      expectListContract(await QuranFoundationAdapter.getReciters('en'));
    },
    TIMEOUT
  );

  it(
    'MP3Quran v3 ayah timings are well formed',
    async () => {
      const reciters = await Mp3QuranAdapter.getReciters('en');
      const candidates = reciters
        .filter((reciter) => reciter.moshaf.hasTimings !== false)
        .slice(0, 3);

      for (const reciter of candidates) {
        const timings = await mp3QuranV3Timings.getSurahTimings(
          reciter.moshaf,
          1
        );
        if (timings.length === 0) continue;

        for (const timing of timings.slice(0, 3)) {
          expect(timing.ayah).toBeGreaterThan(0);
          expect(timing.startMs).toBeGreaterThanOrEqual(0);
          expect(timing.endMs).toBeGreaterThan(timing.startMs);
        }
        return;
      }

      // No timed moshaf in the sample: the endpoint contract is unverified,
      // but the adapter must not throw.
      expect(candidates.length).toBeGreaterThan(0);
    },
    TIMEOUT
  );

  it(
    'Qurani.ai timings are well formed',
    async () => {
      const reciters = await QuranAiAdapter.getReciters('en');
      const first = reciters[0];
      expect(first).toBeDefined();
      if (!first) return;

      const timings = await quranAiTimings.getSurahTimings(first.moshaf, 1);
      expect(Array.isArray(timings)).toBe(true);

      for (const timing of timings.slice(0, 3)) {
        expect(timing.ayah).toBeGreaterThan(0);
        expect(timing.startMs).toBeGreaterThanOrEqual(0);
        expect(timing.endMs).toBeGreaterThan(timing.startMs);
      }
    },
    TIMEOUT
  );
});
