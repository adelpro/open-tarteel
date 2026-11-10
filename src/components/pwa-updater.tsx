'use client';

import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import Dialog from './dialog';

/**
 * PwaUpdater
 *
 * Prompts when a new service worker is waiting. The worker is configured with
 * `skipWaiting: false`, so it stays waiting until the user accepts. This keeps
 * the current caches alive during playback or an offline download.
 */
const PwaUpdater = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    const showUpdatePrompt = (worker: ServiceWorker | null) => {
      if (cancelled || !worker) return;
      setWaitingWorker(worker);
      setIsOpen(true);
    };

    // A first install claims the page mid-session. Reloading for that event
    // would throw away the page the visitor is already using; only reload when
    // an existing controller is replaced by an accepted update.
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (!hadController) return;
      globalThis.location.reload();
    };

    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      // An update may already be waiting when the page loads.
      showUpdatePrompt(registration.waiting);

      const onUpdateFound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          // Only prompt when an existing controller is being replaced.
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            showUpdatePrompt(installingWorker);
          }
        });
      };

      registration.addEventListener('updatefound', onUpdateFound);
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange
    );

    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (cancelled) return;
        if (registration) {
          watchRegistration(registration);
          return;
        }
        return navigator.serviceWorker.ready.then((readyRegistration) => {
          if (!cancelled) watchRegistration(readyRegistration);
        });
      })
      .catch(() => {
        /* no-op: SW may not be registered yet in dev */
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
    };
  }, []);

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setIsOpen(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className="max-w-md"
      ariaLabelledBy="pwa-update-title"
    >
      <div className="flex flex-col gap-4 p-4">
        <h2 id="pwa-update-title" className="text-lg font-bold text-foreground">
          {formatMessage({ id: 'pwa.update_title' })}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatMessage({ id: 'pwa.update_description' })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {formatMessage({ id: 'pwa.update_later' })}
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {formatMessage({ id: 'pwa.update_now' })}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default PwaUpdater;
