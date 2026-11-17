import { describe, expect, it } from 'vitest';

import { LinkSource } from '@/types';

import {
  resolveRemoteSettings,
  shouldPushLocalSettings,
  toRemoteSettings,
} from './settings-sync';

// Ported from Tilawa's test/settings-sync.test.ts, over Tarteel's fields.

const NOW = 1_700_000_000_000;
const sources = JSON.stringify([LinkSource.MP3QURAN, LinkSource.ITQAN]);

describe('resolveRemoteSettings', () => {
  it('applies every field of a newer remote object', () => {
    expect(
      resolveRemoteSettings(
        { updatedAt: NOW - 10 },
        {
          theme: 'dark',
          palette: 'night',
          sources,
          sort: 'popular',
          visualizer: 'peaks',
          speed: 1.5,
          updatedAt: NOW - 5,
        },
        NOW
      )
    ).toEqual({
      theme: 'dark',
      palette: 'night',
      sources: [LinkSource.MP3QURAN, LinkSource.ITQAN],
      sort: 'popular',
      visualizer: 'peaks',
      speed: 1.5,
      updatedAt: NOW - 5,
    });
  });

  it('ignores an older remote object', () => {
    expect(
      resolveRemoteSettings(
        { updatedAt: NOW - 5 },
        { speed: 2, updatedAt: NOW - 10 },
        NOW
      )
    ).toBeNull();
  });

  it('ignores an equal stamp: it is this device’s own echo', () => {
    expect(
      resolveRemoteSettings(
        { updatedAt: NOW - 5 },
        { speed: 2, updatedAt: NOW - 5 },
        NOW
      )
    ).toBeNull();
  });

  it('never lets an unstamped remote object override a stamped device', () => {
    expect(
      resolveRemoteSettings({ updatedAt: NOW - 5 }, { speed: 2 }, NOW)
    ).toBeNull();
  });

  it('treats a stamp far in the future as a broken clock', () => {
    expect(
      resolveRemoteSettings(
        { updatedAt: NOW - 5 },
        { speed: 2, updatedAt: NOW + 61_000 },
        NOW
      )
    ).toBeNull();
  });

  it('accepts a stamp inside the clock-skew tolerance', () => {
    expect(
      resolveRemoteSettings(
        { updatedAt: NOW - 5 },
        { speed: 2, updatedAt: NOW + 30_000 },
        NOW
      )?.speed
    ).toBe(2);
  });

  it('drops values the app does not offer', () => {
    expect(
      resolveRemoteSettings(
        {},
        {
          theme: 'blue',
          palette: 'neon',
          sources: JSON.stringify(['example.com']),
          sort: 'random',
          visualizer: 'waterfall',
          speed: 3,
          updatedAt: NOW,
        },
        NOW
      )
    ).toBeNull();
  });

  it('keeps valid fields next to invalid ones', () => {
    expect(
      resolveRemoteSettings(
        {},
        { speed: 99, theme: 'system', sort: 'random', updatedAt: NOW },
        NOW
      )
    ).toEqual({ theme: 'system', updatedAt: NOW });
  });

  it('accepts the account settings on a device that never chose anything', () => {
    expect(
      resolveRemoteSettings({}, { palette: 'classic', updatedAt: NOW }, NOW)
    ).toEqual({ palette: 'classic', updatedAt: NOW });
  });

  it('ignores a non-object payload', () => {
    expect(resolveRemoteSettings({}, null, NOW)).toBeNull();
    expect(resolveRemoteSettings({}, 'settings', NOW)).toBeNull();
  });

  describe('sources', () => {
    const resolve = (value: unknown) =>
      resolveRemoteSettings({}, { sources: value, updatedAt: NOW }, NOW)
        ?.sources;

    it('travels as a JSON string, because Gun stores no arrays', () => {
      expect(resolve(sources)).toEqual([LinkSource.MP3QURAN, LinkSource.ITQAN]);
      expect(resolve([LinkSource.MP3QURAN])).toBeUndefined();
    });

    it('keeps the known sources and drops the rest', () => {
      expect(
        resolve(JSON.stringify([LinkSource.QURANAI, 'example.com']))
      ).toEqual([LinkSource.QURANAI]);
    });

    it('never empties the list: one source always stays enabled', () => {
      expect(resolve('[]')).toBeUndefined();
      expect(resolve(JSON.stringify(['example.com']))).toBeUndefined();
    });

    it('survives a malformed string', () => {
      expect(resolve('{oops')).toBeUndefined();
    });
  });
});

describe('shouldPushLocalSettings', () => {
  it('pushes a local change newer than the account', () => {
    expect(
      shouldPushLocalSettings(
        { updatedAt: NOW - 1 },
        { updatedAt: NOW - 5 },
        NOW
      )
    ).toBe(true);
  });

  it('pushes to an account that has no settings yet', () => {
    expect(shouldPushLocalSettings({ updatedAt: NOW - 1 }, {}, NOW)).toBe(true);
  });

  it('does not rewrite an account level with this device', () => {
    expect(
      shouldPushLocalSettings(
        { updatedAt: NOW - 5 },
        { updatedAt: NOW - 5 },
        NOW
      )
    ).toBe(false);
  });

  it('never pushes the defaults of a device that changed nothing', () => {
    expect(
      shouldPushLocalSettings({}, { theme: 'dark', updatedAt: NOW - 5 }, NOW)
    ).toBe(false);
  });

  it('does not push a stamp from a broken clock', () => {
    expect(shouldPushLocalSettings({ updatedAt: NOW + 61_000 }, {}, NOW)).toBe(
      false
    );
  });
});

describe('toRemoteSettings', () => {
  it('writes the whole object with one stamp and sources as JSON', () => {
    const remote = toRemoteSettings(
      {
        theme: 'light',
        palette: 'warm',
        sources: [LinkSource.ITQAN],
        sort: 'views',
        visualizer: 'ribbon',
        speed: 1,
      },
      NOW
    );
    expect(remote).toEqual({
      theme: 'light',
      palette: 'warm',
      sources: JSON.stringify([LinkSource.ITQAN]),
      sort: 'views',
      visualizer: 'ribbon',
      speed: 1,
      updatedAt: NOW,
    });
    // What one device writes, another resolves to the same values.
    expect(resolveRemoteSettings({}, remote, NOW)?.sources).toEqual([
      LinkSource.ITQAN,
    ]);
  });
});
