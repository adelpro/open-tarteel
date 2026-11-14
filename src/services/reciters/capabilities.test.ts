import { describe, expect, it } from 'vitest';

import { LinkSource, Riwaya } from '@/types';

import {
  canDownload,
  canUseFollowAlong,
  canUseRangeMode,
  FOLLOW_ALONG_V4_RECITER_IDS,
  followAlongBlockReason,
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
    expect(canDownload(LinkSource.MP3QURAN_V4)).toBe(true);
    expect(canDownload(LinkSource.QURANAI)).toBe(true);
    expect(canDownload(LinkSource.QURAN_FOUNDATION)).toBe(true);
  });
});

describe('canUseFollowAlong', () => {
  const moshaf = (
    id = '1',
    riwaya: Riwaya = Riwaya.Hafs,
    hasTimings = true
  ): { id: string; riwaya: Riwaya; hasTimings: boolean } => ({
    id,
    riwaya,
    hasTimings,
  });

  it('accepts both providers that publish word timings', () => {
    expect(canUseFollowAlong(LinkSource.QURAN_FOUNDATION, moshaf())).toBe(true);
    expect(canUseFollowAlong(LinkSource.MP3QURAN_V4, moshaf('118'))).toBe(true);
  });

  it('rejects providers without word timings', () => {
    expect(canUseFollowAlong(LinkSource.MP3QURAN, moshaf())).toBe(false);
    expect(canUseFollowAlong(LinkSource.ITQAN, moshaf())).toBe(false);
    expect(canUseFollowAlong(LinkSource.QURANAI, moshaf())).toBe(false);
  });

  it('rejects riwayat other than Hafs', () => {
    expect(
      canUseFollowAlong(LinkSource.QURAN_FOUNDATION, moshaf('1', Riwaya.Warsh))
    ).toBe(false);
    expect(
      canUseFollowAlong(LinkSource.MP3QURAN_V4, moshaf('118', Riwaya.Qaloon))
    ).toBe(false);
  });

  it('rejects MP3Quran v4 recitations outside the audited set', () => {
    expect(canUseFollowAlong(LinkSource.MP3QURAN_V4, moshaf('999'))).toBe(
      false
    );
  });

  it('rejects flagged-without-timings recitations and missing input', () => {
    expect(
      canUseFollowAlong(
        LinkSource.QURAN_FOUNDATION,
        moshaf('1', Riwaya.Hafs, false)
      )
    ).toBe(false);
    expect(canUseFollowAlong(undefined, moshaf())).toBe(false);
    expect(canUseFollowAlong(LinkSource.QURAN_FOUNDATION, null)).toBe(false);
  });

  it('excludes the repeats-for-children Quran Foundation recitation', () => {
    expect(canUseFollowAlong(LinkSource.QURAN_FOUNDATION, moshaf('168'))).toBe(
      false
    );
    expect(canUseFollowAlong(LinkSource.QURAN_FOUNDATION, moshaf('2'))).toBe(
      true
    );
  });

  it('keeps the audited v4 set explicit', () => {
    expect(FOLLOW_ALONG_V4_RECITER_IDS.size).toBe(12);
    expect([...FOLLOW_ALONG_V4_RECITER_IDS]).toContain('118');
  });
});

describe('followAlongBlockReason', () => {
  const moshaf = (
    id = '1',
    riwaya: Riwaya = Riwaya.Hafs,
    hasTimings = true
  ): { id: string; riwaya: Riwaya; hasTimings: boolean } => ({
    id,
    riwaya,
    hasTimings,
  });

  it('reports the first reason that blocks the mode', () => {
    expect(
      followAlongBlockReason(LinkSource.QURAN_FOUNDATION, moshaf(), false)
    ).toBe('offline');
    expect(followAlongBlockReason(LinkSource.ITQAN, moshaf())).toBe('provider');
    expect(
      followAlongBlockReason(
        LinkSource.QURAN_FOUNDATION,
        moshaf('1', Riwaya.Warsh)
      )
    ).toBe('not-hafs');
    expect(
      followAlongBlockReason(
        LinkSource.QURAN_FOUNDATION,
        moshaf('1', Riwaya.Hafs, false)
      )
    ).toBe('no-timings');
    expect(
      followAlongBlockReason(LinkSource.QURAN_FOUNDATION, moshaf('168'))
    ).toBe('unaudited');
    expect(followAlongBlockReason(LinkSource.MP3QURAN_V4, moshaf('999'))).toBe(
      'unaudited'
    );
  });

  it('returns null when everything lines up', () => {
    expect(
      followAlongBlockReason(LinkSource.QURAN_FOUNDATION, moshaf('2'))
    ).toBeNull();
    expect(
      followAlongBlockReason(LinkSource.MP3QURAN_V4, moshaf('118'))
    ).toBeNull();
  });
});
