import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  qfFetch,
  resetQuranFoundationClientCache,
} from './quran-foundation.client';

describe('quran-foundation.client', () => {
  beforeEach(() => {
    vi.stubEnv('QURAN_FOUNDATION_CLIENT_ID', 'test-client');
    vi.stubEnv('QURAN_FOUNDATION_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('QURAN_FOUNDATION_RATE_LIMIT_MS', '0');
    resetQuranFoundationClientCache();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ access_token: 'valid-token', expires_in: 3600 }),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('qfFetch', () => {
    it('should throw if client id is not set', async () => {
      vi.stubEnv('QURAN_FOUNDATION_CLIENT_ID', '');
      await expect(qfFetch('/api/test')).rejects.toThrow(
        'QURAN_FOUNDATION_CLIENT_ID is not set'
      );
    });

    it('should fetch a token and append headers', async () => {
      const fetchMock = vi.mocked(fetch);

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ access_token: 'fresh-token', expires_in: 3600 }),
        } as Response)
      );

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );

      const response = await qfFetch('/api/data');
      const data = await response.json();

      expect(data).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'https://oauth2.quran.foundation/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from(
              'test-client:test-secret'
            ).toString('base64')}`,
          }),
        })
      );

      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'https://apis.quran.foundation/api/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-auth-token': 'fresh-token',
          }),
        })
      );
    });

    it('should retry on 401 with a fresh token', async () => {
      const fetchMock = vi.mocked(fetch);

      // 1. Initial token fetch
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ access_token: 'stale-token', expires_in: 3600 }),
        } as Response)
      );

      // 2. Data fetch with stale token returns 401
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      // 3. Fresh token fetch
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({ access_token: 'fresh-token', expires_in: 3600 }),
        } as Response)
      );

      // 4. Data fetch succeeds
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: 'works' }),
        } as Response)
      );

      await qfFetch('/api/retry');

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });
});
