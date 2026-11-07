'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MdCloudDone, MdDeleteOutline } from 'react-icons/md';
import { FormattedMessage } from 'react-intl';

import {
  type CachedMoshaf,
  type StorageEstimate,
  useOfflineDownload,
} from '@/hooks/use-offline-download';
import { formatBytes } from '@/utils';

export default function CacheManagement() {
  const {
    storagePersisted,
    estimateStorage,
    getCachedMoshafs,
    removeCachedLinks,
  } = useOfflineDownload();

  const [moshafs, setMoshafs] = useState<CachedMoshaf[]>([]);
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);

  const refreshStorage = useCallback(async () => {
    const estimate = await estimateStorage();
    setStorage(estimate);
  }, [estimateStorage]);

  const scan = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCachedMoshafs();
      setMoshafs(result);
      await refreshStorage();
    } catch {
      // ignore
    }
    setLoading(false);
  }, [getCachedMoshafs, refreshStorage]);

  // Re-scan when the shared download records change
  useEffect(() => {
    scan();
  }, [scan]);

  const handleDelete = async (moshaf: CachedMoshaf) => {
    await removeCachedLinks(moshaf.links);
    // Storage estimate is refreshed by the shared records → scan → refreshStorage
  };

  if (loading) {
    return (
      <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <FormattedMessage
          id="settings.cacheLoading"
          defaultMessage="Scanning cached downloads…"
        />
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {storage && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <FormattedMessage
            id="settings.cacheStorageUsed"
            defaultMessage="Storage used: {used} of {quota}"
            values={{
              used: formatBytes(storage.usage),
              quota: formatBytes(storage.quota),
            }}
          />
        </p>
      )}

      {storagePersisted === false && (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <span aria-hidden="true">⚠</span>
          <FormattedMessage
            id="storage.notPersisted"
            defaultMessage="The browser may remove downloads when storage is low."
          />
        </p>
      )}

      {moshafs.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <FormattedMessage
            id="settings.cacheEmpty"
            defaultMessage="No offline downloads yet."
          />
        </p>
      ) : (
        <ul className="space-y-3">
          {moshafs.map((moshaf) => (
            <li
              key={`${moshaf.reciterName}-${moshaf.moshafName}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MdCloudDone size={16} className="shrink-0 text-green-500" />
                  <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                    {moshaf.reciterName}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {moshaf.moshafName} &middot;{' '}
                  <FormattedMessage
                    id="settings.cacheTracks"
                    defaultMessage="{count} surahs"
                    values={{ count: moshaf.trackCount }}
                  />{' '}
                  &middot; {formatBytes(moshaf.totalBytes)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(moshaf)}
                className="ms-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                aria-label={`Remove ${moshaf.reciterName}`}
                title={`Remove ${moshaf.reciterName}`}
              >
                <MdDeleteOutline size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
