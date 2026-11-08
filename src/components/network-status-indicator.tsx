'use client';

import { useAtom } from 'jotai';
import React from 'react';
import { MdCloudOff } from 'react-icons/md';
import { FormattedMessage } from 'react-intl';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { forcedOfflineAtom } from '@/jotai/atom';
import { cn } from '@/utils';

/**
 * A quiet, docked offline strip. Passive offline is a neutral state; only a
 * user-forced offline mode gets the warning tone and an action.
 */
export default function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [forcedOffline, setForcedOffline] = useAtom(forcedOfflineAtom);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline status"
      role="status"
      aria-live="polite"
      className="w-full"
    >
      <div
        className={cn(
          'flex min-h-11 w-full items-center gap-2 rounded-[10px] border bg-surface-sunken px-3 py-2 text-[13px]',
          forcedOffline
            ? 'border-s-[3px] border-border border-s-warning'
            : 'border-border'
        )}
      >
        <MdCloudOff
          className={cn(
            'size-4 shrink-0',
            forcedOffline ? 'text-warning' : 'text-ink-muted'
          )}
          aria-hidden="true"
        />

        <span className="min-w-0 flex-1 leading-5 text-ink">
          <FormattedMessage
            id={forcedOffline ? 'offline.forcedStatus' : 'offline.status'}
            defaultMessage={
              forcedOffline
                ? 'Offline — downloads only'
                : 'Offline — showing downloads'
            }
          />
        </span>

        {forcedOffline ? (
          <button
            type="button"
            onClick={() => setForcedOffline(false)}
            className="-me-2 flex h-11 shrink-0 items-center rounded-[8px] px-2 text-[13px] font-bold text-primary transition-colors duration-120 hover:bg-surface"
          >
            <FormattedMessage
              id="offline.goOnline"
              defaultMessage="Go online"
            />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
