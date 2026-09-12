'use client';

import Dialog from '@components/dialog';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

/**
 * PwaUpdater
 *
 * Listens to the Serwist service worker lifecycle events and prompts the
 * user to refresh when a new version is waiting to activate.
 *
 * Serwist (`@serwist/next`) automatically registers the service worker and
 * exposes the instance on `window.serwist` (see `@serwist/next/typings`).
 * We only need to attach the `waiting` and `controlling` listeners here so
 * the update prompt and auto-reload behaviour work.
 */
const PwaUpdater = () => {
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Serwist exposes the instance as `window.serwist` (not `window.wb`).
    const wb = window.serwist;
    if (!wb) return;

    const onWaiting = () => {
      setShowUpdateDialog(true);
    };
    const onControlling = () => {
      // Reload once the new service worker takes control so the user
      // gets the latest cached assets.
      window.location.reload();
    };

    wb.addEventListener('waiting', onWaiting);
    wb.addEventListener('controlling', onControlling);

    // If a waiting SW already exists when the component mounts (e.g. the
    // user navigated here after an update was downloaded), prompt now.
    wb.getSW()
      .then((sw) => {
        if (sw?.state === 'installed') {
          setShowUpdateDialog(true);
        }
      })
      .catch(() => {
        /* no-op: SW may not be registered yet in dev */
      });

    return () => {
      wb.removeEventListener('waiting', onWaiting);
      wb.removeEventListener('controlling', onControlling);
    };
  }, []);

  const handleUpdate = () => {
    if (typeof window === 'undefined') return;
    const wb = window.serwist;
    if (!wb) return;
    // Tell the waiting service worker to skip waiting so it activates.
    wb.messageSkipWaiting();
    setShowUpdateDialog(false);
  };

  return (
    <Dialog
      isOpen={showUpdateDialog}
      setIsOpen={setShowUpdateDialog}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 p-4">
        <h2 className="text-lg font-bold text-foreground">
          {formatMessage({ id: 'pwa.update_title' })}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatMessage({ id: 'pwa.update_description' })}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowUpdateDialog(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {formatMessage({ id: 'pwa.update_later' })}
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            {formatMessage({ id: 'pwa.update_now' })}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default PwaUpdater;
