import { act, renderHook } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { offlineModeAtom } from '@/jotai/offline-mode';

import {
  resetNetworkStatusForTests,
  retryConnectivityCheck,
  useNetworkStatus,
  useNetworkStatusDetails,
} from './use-network-status';

describe('useNetworkStatus', () => {
  const originalOnLine = navigator.onLine;
  const originalServiceWorker = navigator.serviceWorker;

  function setOnLine(value: boolean) {
    Object.defineProperty(navigator, 'onLine', {
      value,
      writable: true,
      configurable: true,
    });
  }

  function wrapperFor(store: ReturnType<typeof createStore>) {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);
  }

  beforeEach(() => {
    resetNetworkStatusForTests();
    localStorage.clear();
    setOnLine(true);
  });

  afterEach(() => {
    setOnLine(originalOnLine);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns true when navigator is online', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it('updates to false when window receives offline event', () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('updates back to true when window receives online event', () => {
    setOnLine(false);

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);

    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('returns false in mode on even while the browser is online', () => {
    const store = createStore();
    store.set(offlineModeAtom, 'on');

    const { result } = renderHook(() => useNetworkStatus(), {
      wrapper: wrapperFor(store),
    });

    expect(result.current).toBe(false);
  });

  it('returns true in mode off even after an offline event', () => {
    const store = createStore();
    store.set(offlineModeAtom, 'off');

    const { result } = renderHook(() => useNetworkStatus(), {
      wrapper: wrapperFor(store),
    });
    expect(result.current).toBe(true);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(true);
  });

  it('follows connectivity events in mode auto', () => {
    const store = createStore();
    store.set(offlineModeAtom, 'auto');

    const { result } = renderHook(() => useNetworkStatus(), {
      wrapper: wrapperFor(store),
    });
    expect(result.current).toBe(true);

    act(() => {
      setOnLine(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      setOnLine(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('marks ready only after the first connectivity check settles', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: {} },
      configurable: true,
    });
    let resolveFetch: (value: { ok: boolean }) => void = () => {};
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<{ ok: boolean }>((resolve) => {
          resolveFetch = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useNetworkStatusDetails());
    expect(result.current.ready).toBe(false);
    expect(result.current.online).toBe(true);

    await act(async () => {
      resolveFetch({ ok: true });
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.ready).toBe(true);
    expect(result.current.online).toBe(true);
  });

  it('marks ready after the immediate navigator.onLine === false path', async () => {
    setOnLine(false);

    const { result } = renderHook(() => useNetworkStatusDetails());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.online).toBe(false);
  });

  it('needs two consecutive failed probes before going offline in auto mode', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: {} },
      configurable: true,
    });
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useNetworkStatus());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(true);

    vi.advanceTimersByTime(11_000);
    await act(async () => {
      await retryConnectivityCheck();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(false);

    fetchMock.mockResolvedValue({ ok: true });
    vi.advanceTimersByTime(11_000);
    await act(async () => {
      await retryConnectivityCheck();
    });
    expect(result.current).toBe(true);
  });

  it('probes again after an initial check with no service worker', async () => {
    const originalServiceWorker = Object.getOwnPropertyDescriptor(
      navigator,
      'serviceWorker'
    );
    resetNetworkStatusForTests();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    });
    await retryConnectivityCheck();

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: {} },
      configurable: true,
    });
    await retryConnectivityCheck();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
    if (originalServiceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
    }
  });
});
