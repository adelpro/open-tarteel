'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { MdCloudDone, MdDeleteOutline } from 'react-icons/md';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  type CachedMoshaf,
  type StorageEstimate,
  useOfflineDownload,
} from '@/hooks/use-offline-download';
import type { Reciter } from '@/types';
import { formatBytes } from '@/utils';
import { getAllReciters } from '@/utils/api';

export default function CacheManagement() {
  const { locale } = useIntl();
  const { cachedUrls, estimateStorage, getCachedMoshafs, removeCachedLinks } =
    useOfflineDownload();

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
      // Fetch all reciters from all sources to match cached URLs
      const reciters: Reciter[] = await getAllReciters(
        locale as 'ar'  | 'en' | 'de',
        []
      );
      const result = await getCachedMoshafs(
        reciters.map((r) => ({
          name: r.name,
          moshaf: {
            name: r.moshaf.name,
            server: r.moshaf.server,
            playlist: r.moshaf.playlist,
          },
        }))
      );
      setMoshafs(result);
      await refreshStorage();
    } catch {
      // ignore
    }
    setLoading(false);
  }, [locale, getCachedMoshafs, refreshStorage]);

  // Re-scan when cached URLs change
  useEffect(() => {
    scan();
  }, [scan, cachedUrls]);

  const handleDelete = async (moshaf: CachedMoshaf) => {
    await removeCachedLinks(moshaf.links);
    // Storage estimate is refreshed automatically via cachedUrls → scan → refreshStorage
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
