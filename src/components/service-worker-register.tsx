'use client';

import { useEffect } from 'react';

/**
 * Register the Serwist worker explicitly. `@serwist/next`'s injected registrar
 * is disabled in next.config.ts because it is tied to the standard Next build;
 * the OpenNext/Cloudflare Worker output needs the same registration path.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const activate = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });
        await navigator.serviceWorker.ready;
        if (cancelled || navigator.serviceWorker.controller) return;

        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => resolve(),
            { once: true }
          );
          // A worker that never claims this page must not leave a pending
          // promise behind; the catch handler below still allows the app to
          // run against the network.
          timeout = setTimeout(resolve, 5_000);
        });
      } catch (error) {
        console.warn('[offline] service worker registration failed', error);
      }
    };

    void activate();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return null;
}
