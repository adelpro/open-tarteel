import { describe, expect, it } from 'vitest';

import { LinkSource } from '@/types';

import {
  canDownload,
  canUseRangeMode,
  getCapabilities,
  hasTiming,
  PROVIDER_CAPABILITIES,
} from './capabilities';

describe('provider capabilities', () => {
  it('covers every LinkSource', () => {
    expect(Object.keys(PROVIDER_CAPABILITIES).sort()).toEqual(
      Object.values(LinkSource).sort()
    );
  });

  it('reflects MP3Quran: ar+en, partial ayah timings, downloadable', () => {
    const caps = getCapabilities(LinkSource.MP3QURAN);
    expect(caps.names).toBe('ar+en');
    expect(caps.timing).toBe('ayah');
    expect(caps.timingCoverage).toBe('partial');
    expect(caps.download).toBe(true);
  });

  it('reflects Itqan: ar+en, ayah timings, restricted CORS', () => {
    const caps = getCapabilities(LinkSource.ITQAN);
    expect(caps.timing).toBe('ayah');
    expect(caps.auth).toBe('optional-key');
    expect(caps.cors).toBe('restricted');
    expect(caps.download).toBe(false);
  });

  it('reflects Qurani.ai: ayah timings and word-by-word audio', () => {
    const caps = getCapabilities(LinkSource.QURANAI);
    expect(caps.timing).toBe('ayah');
    expect(caps.wordAudio).toBe(true);
    expect(caps.download).toBe(true);
  });

  it('reflects Quran Foundation: word timings, implemented integration', () => {
    const caps = getCapabilities(LinkSource.QURAN_FOUNDATION);
    expect(caps.timing).toBe('word');
    expect(caps.timingIntegration).toBe('implemented');
  });

  it('enables range mode for every wired timing provider', () => {
    expect(canUseRangeMode(LinkSource.QURAN_FOUNDATION)).toBe(true);
    expect(canUseRangeMode(LinkSource.ITQAN)).toBe(true);
    expect(canUseRangeMode(LinkSource.MP3QURAN)).toBe(true);
    expect(canUseRangeMode(LinkSource.QURANAI)).toBe(true);
    expect(canUseRangeMode(LinkSource.MP3QURAN_V4)).toBe(true);
    expect(canUseRangeMode(undefined)).toBe(false);
    expect(
      canUseRangeMode(LinkSource.ITQAN, { hasTimings: false } as never)
    ).toBe(false);
  });

  it('exposes timing and download helpers', () => {
    expect(hasTiming(LinkSource.MP3QURAN)).toBe(true);
    expect(canDownload(LinkSource.ITQAN)).toBe(false);
    expect(canDownload(LinkSource.MP3QURAN)).toBe(true);
  });
});
