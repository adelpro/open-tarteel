'use client';

import { useEffect } from 'react';

/**
 * Staging only: when a new worker takes control (skipWaiting), reload once so
 * the page and its chunks cannot come from different builds. Production keeps
 * the explicit update prompt because a reload can interrupt playback.
 */
export function ServiceWorkerRefresh() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (sessionStorage.getItem('sw-refreshed') === '1') return;
      sessionStorage.setItem('sw-refreshed', '1');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange
    );
    return () =>
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
  }, []);

  return null;
}
