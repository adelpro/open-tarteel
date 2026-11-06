import { describe, expect, it } from 'vitest';

import { getCapabilities } from '@/services/reciters/capabilities';
import { LinkSource } from '@/types';

import { getProviderBadges } from './provider-badge';

describe('getProviderBadges', () => {
  it('orders Itqan as no download, then timing', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.ITQAN)).map((b) => b.key)
    ).toEqual(['no-download', 'timing']);
  });

  it('orders Quran Foundation as timing + word', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURAN_FOUNDATION)).map(
        (b) => b.key
      )
    ).toEqual(['timing', 'word']);
  });

  it('keeps MP3Quran and Qurani.ai concise', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.MP3QURAN)).map((b) => b.key)
    ).toEqual(['timing']);
    expect(
      getProviderBadges(getCapabilities(LinkSource.QURANAI)).map((b) => b.key)
    ).toEqual(['timing', 'word']);
  });

  it('puts the beta badge first for MP3Quran v4', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.MP3QURAN_V4)).map(
        (b) => b.key
      )
    ).toEqual(['beta', 'timing', 'word']);
  });
});
