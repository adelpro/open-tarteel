'use client';

import { HardDrive, Music, RefreshCw, Trash2 } from 'lucide-react';
import { useIntl } from 'react-intl';

import { formatBytes, getMessageConfig as t } from '@/helpers';
import { useStorageStats } from '@/hooks/use-storage-stats';
import { cn } from '@/lib/utils';

export function StorageSettings() {
  const { formatMessage } = useIntl();
  const {
    core,
    tracks,
    total,
    loading,
    error,
    reload,
    clearCore,
    clearTracks,
  } = useStorageStats();
  const CATEGORIES = [
    {
      id: 'core',
      labelKey: 'settings.storage.coreData',
      descriptionKey: 'settings.storage.coreData.description',
      bytes: core.bytes,
      icon: <HardDrive className="size-4" />,
      barColor: 'bg-foreground/40',
    },
    {
      id: 'tracks',
      labelKey: 'settings.storage.appData',
      descriptionKey: 'settings.storage.appData.description',
      bytes: tracks.bytes,
      icon: <Music className="size-4" />,
      barColor: 'bg-foreground',
    },
  ];

  const clearCategory = (id: string) => {
    if (id === 'core') clearCore();
    if (id === 'tracks') clearTracks();
  };
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <span>{error}</span>
        <button onClick={reload} className="underline">
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {formatMessage(t('settings.storage.title'))}
          </h3>
          <button
            onClick={reload}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={formatMessage(t('settings.storage.refresh'))}
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>

        {/* Total bar */}
        <div className="mb-1.5">
          <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
            {CATEGORIES.map((cat, index) => {
              const pct = total > 0 ? (cat.bytes / total) * 100 : 0;
              const offset = CATEGORIES.slice(0, index).reduce(
                (sum, c) => sum + (total > 0 ? (c.bytes / total) * 100 : 0),
                0
              );
              return (
                <div
                  key={cat.id}
                  className={cn(
                    'absolute inset-y-0 transition-all duration-500',
                    cat.barColor,
                    index === 0 && 'rounded-l-full',
                    index === CATEGORIES.length - 1 && 'rounded-r-full'
                  )}
                  style={{ left: `${offset}%`, width: `${pct}%` }}
                />
              );
            })}
          </div>
          <p className="mt-1 text-end text-[10px] tabular-nums text-muted-foreground">
            {formatBytes(total)} {formatMessage(t('settings.storage.total'))}
          </p>
        </div>

        {/* Category rows */}
        <div className="mt-4 flex flex-col gap-3">
          {CATEGORIES.map((cat) => {
            const pct = total > 0 ? (cat.bytes / total) * 100 : 0;
            return (
              <div
                key={cat.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="text-muted-foreground">{cat.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatMessage(t(cat.labelKey))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMessage(t(cat.descriptionKey))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatBytes(cat.bytes)}
                    </span>
                    <button
                      onClick={() => clearCategory(cat.id)}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive-foreground"
                      aria-label={`${formatMessage(t('settings.storage.clear'))} ${formatMessage(t(cat.labelKey))}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      cat.barColor
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
