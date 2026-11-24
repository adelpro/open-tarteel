'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
    progress,
    getCachedMoshafs,
    removeCachedLinks,
  } = useOfflineDownload();

  const [moshafs, setMoshafs] = useState<CachedMoshaf[]>([]);
  const [loading, setLoading] = useState(true);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  // Speed updates many times a second. Show a value that refreshes at most
  // once a second so the number stays readable.
  const [displaySpeed, setDisplaySpeed] = useState(0);
  const speedRef = useRef(0);
  speedRef.current = progress?.speedBps ?? 0;
  const isDownloading = Boolean(progress);

  const currentSurah = useMemo(() => {
    const match = progress?.currentUrl?.match(/\/(\d{3})\.mp3/);
    return match ? String(Number(match[1])) : null;
  }, [progress?.currentUrl]);

  useEffect(() => {
    if (!isDownloading) {
      setDisplaySpeed(0);
      return;
    }
    setDisplaySpeed(speedRef.current);
    const timer = window.setInterval(
      () => setDisplaySpeed(speedRef.current),
      1000
    );
    return () => window.clearInterval(timer);
  }, [isDownloading]);

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
      <p className="py-4 text-center text-[13px] text-ink-muted">
        <FormattedMessage
          id="settings.cacheLoading"
          defaultMessage="Scanning cached downloads…"
        />
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {progress ? (
        <div className="rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate font-bold text-ink">
              <FormattedMessage
                id="settings.downloadingSurah"
                defaultMessage="Downloading surah {surah}"
                values={{ surah: currentSurah ?? '…' }}
              />
            </span>
            <span className="shrink-0 tabular-nums text-ink-muted">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div
            className="mt-2 h-1 overflow-hidden rounded-full bg-surface-sunken"
            role="progressbar"
            aria-valuenow={Math.round(progress.currentTrackProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-180 ease-standard"
              style={{ width: `${progress.currentTrackProgress * 100}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[12px] text-ink-muted">
            <span className="tabular-nums">
              {Math.round(progress.currentTrackProgress * 100)}%
            </span>
            <span className="tabular-nums">
              <FormattedMessage
                id="settings.downloadSpeed"
                defaultMessage="Speed {speed}"
                values={{ speed: `${formatBytes(displaySpeed)}/s` }}
              />
            </span>
          </div>
        </div>
      ) : null}

      {storage && (
        <p className="text-[12px] text-ink-muted">
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
        <p className="flex items-start gap-2 rounded-[8px] bg-surface-sunken px-3 py-2 text-[12px] text-warning">
          <span aria-hidden="true">⚠</span>
          <FormattedMessage
            id="storage.notPersisted"
            defaultMessage="The browser may remove downloads when storage is low."
          />
        </p>
      )}

      {moshafs.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-ink-muted">
          <FormattedMessage
            id="settings.cacheEmpty"
            defaultMessage="No offline downloads yet."
          />
        </p>
      ) : (
        <ul className="space-y-2">
          {moshafs.map((moshaf) => (
            <li
              key={`${moshaf.reciterName}-${moshaf.moshafName}`}
              className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MdCloudDone size={16} className="shrink-0 text-success" />
                  <span className="truncate text-[14px] font-bold text-ink">
                    {moshaf.reciterName}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-ink-muted">
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
                className="ms-3 flex size-9 shrink-0 items-center justify-center rounded-full text-danger transition-colors duration-120 hover:bg-surface-sunken"
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
