'use client';

import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { updateDeviceName } from '@/hooks/use-user-sync';
import {
  type DeviceRow,
  userDevicesAtom,
  userDevicesMetaAtom,
} from '@/jotai/account';
import { cn } from '@/utils';
import { getOrCreateDeviceId } from '@/utils/device/device-id';
import { setDeviceName } from '@/utils/device/device-name';
import { relativeTime } from '@/utils/relative-time';

import { messages } from './messages';
import { input, note } from './ui';

export default function DeviceList({
  highlightId,
}: {
  highlightId?: string | null;
}) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const devices = useAtomValue(userDevicesAtom);
  const meta = useAtomValue(userDevicesMetaAtom);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const currentId = getOrCreateDeviceId();

  /** "3 months ago", in the page's language and grammar. */
  const ago = (timestamp?: number): string => {
    if (!timestamp) return '—';
    const { unit, value } = relativeTime(timestamp);
    return unit === 'now'
      ? intl.formatRelativeTime(0, 'second', { numeric: 'auto' })
      : intl.formatRelativeTime(-value, unit);
  };

  const exact = (timestamp?: number): string | undefined =>
    timestamp
      ? intl.formatDate(timestamp, { dateStyle: 'medium', timeStyle: 'short' })
      : undefined;

  const rows = Object.values(devices)
    .filter((device): device is DeviceRow => Boolean(device?.id))
    .sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0));

  const startRename = (device: DeviceRow) => {
    setEditing(device.id);
    setDraft(device.name || '');
  };

  const commitRename = (device: DeviceRow) => {
    const next = draft.trim() || 'Device';
    updateDeviceName(device.id, next);
    if (device.id === currentId) setDeviceName(next);
    setEditing(null);
  };

  return (
    <div className="space-y-3">
      <p className={note}>{formatMessage(messages.devicesNote)}</p>

      <ul className="divide-y divide-border rounded-[12px] border border-border">
        {rows.length === 0 ? (
          <li className="px-3 py-4 text-[14px] text-ink-muted">
            {formatMessage(messages.noDevices)}
          </li>
        ) : (
          rows.map((device) => {
            const isThis = device.id === currentId;
            const isPrimary = Boolean(
              meta?.primaryDeviceId && device.id === meta.primaryDeviceId
            );
            const highlighted = highlightId === device.id;
            return (
              <li
                key={device.id}
                data-device-id={device.id}
                data-highlight={highlighted ? 'true' : undefined}
                className={cn(
                  'px-3 py-3 transition-colors',
                  highlighted && 'ring-1 ring-inset ring-primary'
                )}
              >
                {editing === device.id ? (
                  <input
                    value={draft}
                    // The field replaces the name the listener just tapped.
                    autoFocus
                    aria-label={formatMessage(messages.rename)}
                    name="device-name"
                    autoComplete="off"
                    maxLength={40}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={() => commitRename(device)}
                    onKeyDown={(event) => {
                      // Enter during an IME composition commits the candidate,
                      // not the field.
                      if (
                        event.key === 'Enter' &&
                        !event.nativeEvent.isComposing
                      ) {
                        commitRename(device);
                      }
                      if (event.key === 'Escape') setEditing(null);
                    }}
                    className={input}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startRename(device)}
                    dir="auto"
                    className="max-w-full truncate text-start text-[14px] font-bold text-ink"
                    title={formatMessage(messages.rename)}
                  >
                    {device.name || 'Device'}
                  </button>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-muted">
                  <span title={exact(device.lastSeen)}>
                    {formatMessage(messages.lastSeen, {
                      when: ago(device.lastSeen),
                    })}
                  </span>
                  {device.linkedAt ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span title={exact(device.linkedAt)}>
                        {formatMessage(messages.added, {
                          when: ago(device.linkedAt),
                        })}
                      </span>
                    </>
                  ) : null}
                </div>
                {isThis || isPrimary ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {isThis ? (
                      <span className="rounded-full bg-surface-sunken px-2 py-1 text-[12px] text-ink">
                        {formatMessage(messages.thisDevice)}
                      </span>
                    ) : null}
                    {isPrimary ? (
                      <span className="rounded-full bg-surface-sunken px-2 py-1 text-[12px] text-ink">
                        {formatMessage(messages.primary)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
