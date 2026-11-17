'use client';

import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { MdCheck, MdClose, MdEdit } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { useGun } from '@/hooks/use-gun';
import { userDevicesAtom } from '@/jotai/account';
import { cn } from '@/utils';
import { getOrCreateDeviceId } from '@/utils/device/device-id';
import { getOrCreateDeviceName } from '@/utils/device/device-name';

import DeviceList from './device-list';
import LinkDevice from './link-device';
import { messages } from './messages';
import {
  card,
  cardTitle,
  chip,
  chipOff,
  chipOn,
  Field,
  input,
  note,
  primaryButton,
  Spinner,
} from './ui';

type Tab = 'devices' | 'add';

/** How long the row that just joined stays tinted. */
const HIGHLIGHT_MS = 8000;

/**
 * The camera gets a fixed height: the viewfinder fills it instead of growing
 * the settings page under the finger.
 */
const CAMERA_BODY = 'flex h-[min(72dvh,30rem)] flex-col overflow-hidden';

/**
 * A ring is one account: the keypair, plus every device that holds a copy of it.
 *
 * Tilawa's `AccountSheet`, placed in the settings page instead of a sheet. The
 * flow is the same: a device in a ring can only add another device to *that*
 * ring, so it is shown the pairing code and never the scanner. Scanning is for
 * a device with no key yet, which is joining a ring rather than adding to one.
 */
export default function AccountPanel() {
  const { formatMessage } = useIntl();
  const {
    loggedIn,
    name,
    loading,
    error,
    createAccount,
    renameAccount,
    logout,
  } = useGun();
  const devices = useAtomValue(userDevicesAtom);
  const [tab, setTab] = useState<Tab>('devices');
  const [confirmText, setConfirmText] = useState('');
  const [camera, setCamera] = useState(false);
  const [ringName, setRingName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  /** The confirmation for a pairing, owned here so a tab switch cannot erase it. */
  const [notice, setNotice] = useState<{
    name?: string;
    self: boolean;
  } | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // The default ring name is the device's, read after mount: localStorage is
  // not there during the server render.
  useEffect(() => {
    setRingName((current) => current || getOrCreateDeviceName());
  }, []);

  const deviceCount = Object.values(devices).filter(
    (device) => device?.id
  ).length;
  const isLastDevice = deviceCount <= 1;
  const confirmWord = formatMessage(messages.signOutConfirmWord);
  const canSignOut =
    !isLastDevice ||
    confirmText.trim().toLowerCase() === confirmWord.toLowerCase();

  const announceJoined = useCallback(
    (device: { id: string; name?: string }, self: boolean) => {
      setNotice({ name: device.name, self });
      setHighlightId(device.id);
      setTab('devices');
    },
    []
  );

  const announceOther = useCallback(
    (device: { id: string; name?: string }) => announceJoined(device, false),
    [announceJoined]
  );

  const announceSelf = useCallback(() => {
    setCamera(false);
    announceJoined(
      { id: getOrCreateDeviceId(), name: getOrCreateDeviceName() },
      true
    );
  }, [announceJoined]);

  const showDevices = useCallback(() => setTab('devices'), []);

  // The tint is a "look here", not a permanent badge.
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const startRenaming = () => {
    setDraftName(name ?? '');
    setEditingName(true);
  };

  const saveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    renameAccount(trimmed);
    setEditingName(false);
  };

  const signOut = () => {
    logout();
    setConfirmText('');
    setNotice(null);
    setHighlightId(null);
    setTab('devices');
  };

  const privacy = (
    <p className={cn(note, camera && 'hidden')}>
      {formatMessage(messages.privacyNote)}
    </p>
  );

  return (
    <div
      className={cn('p-4', camera ? CAMERA_BODY : 'space-y-3')}
      data-testid="account-panel"
    >
      {loggedIn ? (
        <>
          <div
            className={cn(
              'flex items-baseline justify-between gap-3',
              camera && 'hidden'
            )}
          >
            {editingName ? (
              <form
                className="flex min-w-0 flex-1 items-center gap-2 self-center"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveName();
                }}
              >
                <input
                  // The field replaces the name the listener just tapped.
                  autoFocus
                  required
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={formatMessage(messages.ringName)}
                  aria-label={formatMessage(messages.ringName)}
                  name="ring-name"
                  autoComplete="off"
                  maxLength={40}
                  className={cn(input, 'min-w-0 flex-1')}
                />
                <button
                  type="submit"
                  aria-label={formatMessage(messages.renameSave)}
                  title={formatMessage(messages.renameSave)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[10px] border border-border text-ink hover:bg-surface-sunken"
                >
                  <MdCheck className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  aria-label={formatMessage(messages.renameCancel)}
                  title={formatMessage(messages.renameCancel)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-ink-muted hover:text-ink"
                >
                  <MdClose className="size-5" aria-hidden="true" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={startRenaming}
                title={formatMessage(messages.rename)}
                className="group flex min-h-11 min-w-0 items-center gap-2 text-[14px] text-ink-muted hover:text-ink"
              >
                <span className="shrink-0">
                  {formatMessage(messages.ringOf)}
                </span>
                {/* `auto`: a Latin device name inside Arabic copy must
                    truncate at its own end, not lose its first word. */}
                <span dir="auto" className="truncate font-bold text-ink">
                  {name || '…'}
                </span>
                <MdEdit
                  aria-hidden="true"
                  className="size-4 shrink-0 opacity-40 group-hover:opacity-100"
                />
              </button>
            )}
            <span className="shrink-0 text-[13px] text-ink-muted">
              {formatMessage(messages.deviceCount, { count: deviceCount })}
            </span>
          </div>

          <div className={cn('flex gap-2', camera && 'hidden')}>
            {(
              [
                ['devices', messages.devices],
                ['add', messages.addDevice],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={tab === key}
                className={cn(chip, tab === key ? chipOn : chipOff)}
              >
                {formatMessage(label)}
              </button>
            ))}
          </div>

          {tab === 'devices' ? (
            <>
              {notice ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2 rounded-[12px] border border-border bg-surface-sunken p-3"
                >
                  <MdCheck
                    aria-hidden="true"
                    className="size-5 shrink-0 text-success"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-ink">
                      {notice.self
                        ? formatMessage(messages.linkedHere)
                        : notice.name
                          ? formatMessage(messages.linkedOtherNamed, {
                              name: notice.name,
                            })
                          : formatMessage(messages.linkedOther)}
                    </p>
                    <p className={cn(note, 'mt-1')}>
                      {formatMessage(messages.linkedHint)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    aria-label={formatMessage({
                      id: 'close',
                      defaultMessage: 'Close',
                    })}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink"
                  >
                    <MdClose className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              <DeviceList highlightId={highlightId} />
              {privacy}
              <div className={card}>
                <p className={cardTitle}>
                  {formatMessage(messages.signOutTitle)}
                </p>
                {isLastDevice ? (
                  <>
                    <p className="mt-1 text-[13px] leading-5 text-danger">
                      {formatMessage(messages.signOutLast)}
                    </p>
                    <div className="mt-2">
                      <Field
                        label={formatMessage(messages.signOutConfirm, {
                          word: confirmWord,
                        })}
                      >
                        {(id) => (
                          <input
                            id={id}
                            value={confirmText}
                            onChange={(event) =>
                              setConfirmText(event.target.value)
                            }
                            name="sign-out-confirm"
                            autoComplete="off"
                            className={input}
                          />
                        )}
                      </Field>
                    </div>
                  </>
                ) : (
                  <p className={cn(note, 'mt-1')}>
                    {formatMessage(messages.signOutSafe)}
                  </p>
                )}
                {/* Disabled here is an interlock, not validation: the button is
                    the irreversible verb and the word is the safety. */}
                <button
                  type="button"
                  disabled={!canSignOut}
                  onClick={signOut}
                  className={cn(
                    'mt-3 min-h-11 w-full rounded-[10px] border px-3 py-2 text-[14px] transition-colors',
                    canSignOut
                      ? 'border-danger/40 hover:bg-danger/10 text-danger'
                      : 'border-border text-ink-muted opacity-50'
                  )}
                >
                  {formatMessage(messages.signOutAction)}
                </button>
              </div>
            </>
          ) : (
            <LinkDevice
              mode="share"
              onLinked={showDevices}
              onCameraChange={setCamera}
              onDeviceJoined={announceOther}
            />
          )}
        </>
      ) : (
        <>
          <form
            className={cn(card, camera && 'hidden')}
            onSubmit={(event) => {
              event.preventDefault();
              if (ringName.trim()) void createAccount(ringName);
            }}
          >
            <p className={cardTitle}>{formatMessage(messages.createTitle)}</p>
            <p className={cn(note, 'mt-1')}>
              {formatMessage(messages.createNote)}
            </p>
            <div className="mt-3">
              <Field label={formatMessage(messages.ringName)}>
                {(id) => (
                  <input
                    id={id}
                    required
                    value={ringName}
                    onChange={(event) => setRingName(event.target.value)}
                    name="ring-name"
                    autoComplete="off"
                    maxLength={40}
                    className={input}
                  />
                )}
              </Field>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(primaryButton, 'mt-3')}
            >
              {loading ? <Spinner /> : null}
              {formatMessage(messages.createAction)}
            </button>
            {error ? (
              <p role="alert" className="mt-2 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
          </form>

          <LinkDevice
            mode="scan"
            onCameraChange={setCamera}
            onLinked={announceSelf}
          />

          {privacy}
        </>
      )}
    </div>
  );
}
