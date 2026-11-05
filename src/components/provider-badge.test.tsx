import { describe, expect, it } from 'vitest';

import { getCapabilities } from '@/services/reciters/capabilities';
import { LinkSource } from '@/types';

import { getProviderBadges } from './provider-badge';

describe('getProviderBadges', () => {
  it('orders Itqan as timing + no download', () => {
    expect(
      getProviderBadges(getCapabilities(LinkSource.ITQAN)).map((b) => b.key)
    ).toEqual(['timing', 'no-download']);
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
});
