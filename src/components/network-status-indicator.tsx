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
      className="fixed left-1/2 top-3 z-50 -translate-x-1/2 animate-fade-down"
    >
      <div className="flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-600/95 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-all dark:border-amber-500/30 dark:bg-amber-700/95 sm:text-sm">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-200 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-white" />
        </span>
        <MdCloudOff className="size-4 shrink-0 text-amber-200" />
        <span className="max-w-[260px] truncate sm:max-w-none">
          <FormattedMessage
            id="offline.status"
            defaultMessage="Offline Mode — Showing downloaded content"
          />
        </span>
      </div>
    </aside>
  );
}
