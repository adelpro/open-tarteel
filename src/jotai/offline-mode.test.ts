import { createStore } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const LEGACY_KEY = 'forced-offline';
const MODE_KEY = 'offline-mode';

describe('legacy forced-offline migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('maps a legacy true to "on" and removes the legacy key', async () => {
    localStorage.setItem(LEGACY_KEY, 'true');

    await import('./offline-mode');

    expect(localStorage.getItem(MODE_KEY)).toBe('"on"');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('maps a legacy false to "auto"', async () => {
    localStorage.setItem(LEGACY_KEY, 'false');

    await import('./offline-mode');

    expect(localStorage.getItem(MODE_KEY)).toBe('"auto"');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('leaves storage untouched and defaults to "auto" without a legacy key', async () => {
    const { offlineModeAtom } = await import('./offline-mode');

    expect(localStorage.getItem(MODE_KEY)).toBeNull();
    expect(createStore().get(offlineModeAtom)).toBe('auto');
  });

  it('is idempotent once the legacy key is gone', async () => {
    localStorage.setItem(LEGACY_KEY, 'true');

    const { migrateLegacyForcedOffline } = await import('./offline-mode');
    migrateLegacyForcedOffline();

    expect(localStorage.getItem(MODE_KEY)).toBe('"on"');
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
  });

  it('falls back to "auto" for an invalid stored mode', async () => {
    localStorage.setItem(MODE_KEY, '"sometimes"');

    const { offlineModeAtom } = await import('./offline-mode');

    expect(createStore().get(offlineModeAtom)).toBe('auto');
  });
});

describe('isEffectivelyOffline', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.each([
    ['on', true, true],
    ['auto', false, true],
    ['auto', true, false],
    ['off', false, false],
  ] as const)(
    'mode %s with online=%s returns %s',
    async (mode, online, expected) => {
      const { isEffectivelyOffline } = await import('./offline-mode');

      expect(isEffectivelyOffline(mode, online)).toBe(expected);
    }
  );
});
