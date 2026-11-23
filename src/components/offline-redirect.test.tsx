import { render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { offlineModeAtom } from '@/jotai/offline-mode';

import OfflineRedirect from './offline-redirect';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
}));

vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: vi.fn(),
}));

describe('OfflineRedirect', () => {
  const originalOnLine = navigator.onLine;
  const originalLocation = window.location.pathname;
  let fetchMock: ReturnType<typeof vi.fn>;

  function wrapperFor(store: ReturnType<typeof createStore>) {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(Provider, { store }, children);
  }

  function setLocation(path: string) {
    window.history.replaceState({}, '', path);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    localStorage.clear();
    setLocation('/');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNetworkStatus).mockReturnValue(false);
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setLocation(originalLocation);
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('does not redirect away from home page when offline', () => {
    mockPathname = '/';
    render(<OfflineRedirect />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not redirect away from reciter page when offline', () => {
    mockPathname = '/reciter/123';
    render(<OfflineRedirect />);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('stays on /offline in forced-offline mode without a connectivity fetch', () => {
    const store = createStore();
    store.set(offlineModeAtom, 'on');
    mockPathname = '/offline';
    setLocation('/offline');
    // The network really is back; the forced-offline guard must still win.
    vi.mocked(useNetworkStatus).mockReturnValue(true);

    render(<OfflineRedirect />, { wrapper: wrapperFor(store) });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redirects to the locale home when the derived hook reports online', () => {
    const store = createStore();
    store.set(offlineModeAtom, 'auto');
    mockPathname = '/en/offline';
    setLocation('/en/offline');
    vi.mocked(useNetworkStatus).mockReturnValue(true);

    render(<OfflineRedirect />, { wrapper: wrapperFor(store) });

    expect(mockReplace).toHaveBeenCalledWith('/en');
    expect(mockPush).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
