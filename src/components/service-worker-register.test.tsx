import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ServiceWorkerRegister from './service-worker-register';

describe('ServiceWorkerRegister', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('registers the app worker explicitly and handles first install', async () => {
    const register = vi.fn().mockResolvedValue({});
    const addEventListener = vi.fn();
    vi.stubGlobal('navigator', {
      ...navigator,
      serviceWorker: {
        register,
        ready: Promise.resolve({}),
        controller: null,
        addEventListener,
      },
    });

    render(<ServiceWorkerRegister />);

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    );
    expect(register).toHaveBeenCalledTimes(1);

    const controllerChange = addEventListener.mock.calls.find(
      ([event]) => event === 'controllerchange'
    )?.[1];
    expect(controllerChange).toBeTypeOf('function');
    await act(async () => {
      controllerChange(new Event('controllerchange'));
    });
  });
});
