'use client';

import React from 'react';
import { MdCloudOff } from 'react-icons/md';
import { FormattedMessage } from 'react-intl';

import { useNetworkStatus } from '@/hooks/use-network-status';

export default function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline status"
      role="status"
      aria-live="polite"
      className="animate-fade-down"
    >
      <div className="flex h-8 items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-600/95 px-3 text-xs font-semibold text-white shadow-sm backdrop-blur-md transition-all dark:border-amber-500/30 dark:bg-amber-700/95">
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-white" />
        </span>
        <MdCloudOff className="size-3.5 shrink-0 text-amber-200" />
        <span className="max-w-[180px] truncate sm:max-w-none">
          <FormattedMessage
            id="offline.status"
            defaultMessage="Offline Mode — Showing downloaded content"
          />
        </span>
      </div>
    </aside>
  );
}
