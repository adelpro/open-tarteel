import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout, retryFetch } from './shared-fetch';

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

const makeOkResponse = (body = '{}') =>
  new Response(body, { status: 200 }) as Response;

const makeErrorResponse = (status: number) =>
  new Response('error', { status }) as Response;

/** Instant delay – skips real backoff waits in retryFetch tests */
const noDelay = () => Promise.resolve();

// ─────────────────────────────────────────────────────
// fetchWithTimeout
// ─────────────────────────────────────────────────────

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves with the fetch response when fetch completes in time', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeOkResponse()));

    const result = await fetchWithTimeout('https://example.com', 5000);

    expect(result.status).toBe(200);
  });

  it('rejects with a timeout error when fetch takes too long', async () => {
    // fetch never resolves
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    const promise = fetchWithTimeout('https://example.com', 100);
    vi.advanceTimersByTime(200);

    await expect(promise).rejects.toThrow('Fetch timeout');
  });
});

// ─────────────────────────────────────────────────────
// retryFetch
// Uses an instant delayFn to skip real backoff delays,
// which also avoids fake-timer/Promise.race edge-cases
// that generate PromiseRejectionHandledWarnings.
// ─────────────────────────────────────────────────────

describe('retryFetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the response immediately on the first successful attempt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeOkResponse()));

    const result = await retryFetch('https://example.com', 3, noDelay);

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries after a non-ok response and returns on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse(500))
        .mockResolvedValueOnce(makeOkResponse())
    );

    const result = await retryFetch('https://example.com', 3, noDelay);

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries after a network error and returns on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(makeOkResponse())
    );

    const result = await retryFetch('https://example.com', 3, noDelay);

    expect(result.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting all attempts', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockRejectedValueOnce(new Error('Connection refused'))
    );

    await expect(retryFetch('https://example.com', 3, noDelay)).rejects.toThrow(
      'Connection refused'
    );

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('throws after all attempts return non-ok responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(makeErrorResponse(503))
        .mockResolvedValueOnce(makeErrorResponse(503))
        .mockResolvedValueOnce(makeErrorResponse(503))
    );

    await expect(retryFetch('https://example.com', 3, noDelay)).rejects.toThrow(
      'HTTP 503'
    );

    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('respects the maxAttempts argument', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
    );

    await expect(retryFetch('https://example.com', 2, noDelay)).rejects.toThrow(
      'fail'
    );

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('calls the delay function between retries', async () => {
    const delayMock = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(makeOkResponse())
    );

    await retryFetch('https://example.com', 3, delayMock);

    // One failure → one delay call
    expect(delayMock).toHaveBeenCalledTimes(1);
    // Called with 2^0 * 1000 = 1000ms for the first backoff
    expect(delayMock).toHaveBeenCalledWith(1000);
  });
});
