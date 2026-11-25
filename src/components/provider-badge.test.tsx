import { describe, expect, it } from 'vitest';

import {
  canUseFollowAlong,
  getCapabilities,
} from '@/services/reciters/capabilities';
import { LinkSource, Riwaya } from '@/types';

import { getProviderBadges } from './provider-badge';

describe('getProviderBadges', () => {
  it('orders Itqan as no download, then timing', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.ITQAN)).map((b) => b.key)
    ).toEqual(['no-download', 'timing']);
  });

  it('orders Quran Foundation as follow-along, timing + word', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURAN_FOUNDATION)).map(
        (b) => b.key
      )
    ).toEqual(['follow-along', 'timing', 'word']);
  });

  it('keeps MP3Quran and Qurani.ai concise', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.MP3QURAN)).map((b) => b.key)
    ).toEqual(['timing']);
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURANAI)).map((b) => b.key)
    ).toEqual(['timing', 'word-audio']);
  });

  it('reserves word-by-word for providers that publish word timings', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURANAI)).map((b) => b.key)
    ).not.toContain('word');
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURAN_FOUNDATION)).map(
        (b) => b.key
      )
    ).toContain('word');
  });

  it('puts the beta badge first for MP3Quran v4', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.MP3QURAN_V4)).map(
        (b) => b.key
      )
    ).toEqual(['beta', 'follow-along', 'timing', 'word']);
  });

  it('does not let the provider badge imply every reciter is enabled', () => {
    expect(getCapabilities(LinkSource.MP3QURAN_V4).followAlong).toBe(true);
    expect(
      canUseFollowAlong(LinkSource.MP3QURAN_V4, {
        id: '999',
        riwaya: Riwaya.Hafs,
      } as never)
    ).toBe(false);
  });
});
