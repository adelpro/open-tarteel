'use client';

import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type MessageDescriptor, useIntl } from 'react-intl';

import {
  createPairingTicket,
  encodeTicket,
  parseTicket,
  redeemTicket,
} from '@/gun/pairing';
import { useGun } from '@/hooks/use-gun';
import { userDevicesAtom } from '@/jotai/account';
import { cn } from '@/utils';
import {
  type CameraFault,
  classifyCameraError,
  hasCameraApi,
} from '@/utils/camera';
import { pairingErrorMessage } from '@/utils/pairing-error';

import { messages } from './messages';
import {
  card,
  cardTitle,
  Field,
  input,
  note,
  primaryButton,
  quietButton,
  secondaryButton,
  Spinner,
} from './ui';

const READER_ID = 'tarteel-qr-reader';

type Mode = 'share' | 'scan';

/**
 * The camera panel: a live viewfinder, the stated reason it could not open, or
 * the paste field. All three share one panel, so a failure never drops the
 * listener back to the card they came from.
 *
 * The reader stays mounted and is only hidden, because the decoder holds a live
 * `<video>` inside it: unmounting the node under a running scanner leaves the
 * stream on and the camera light lit.
 */
type ScanView = 'camera' | 'paste';

function faultCopy(fault: CameraFault): {
  title: MessageDescriptor;
  note: MessageDescriptor;
} {
  switch (fault) {
    case 'blocked': {
      return {
        title: messages.cameraBlockedTitle,
        note: messages.cameraBlockedNote,
      };
    }
    case 'no-device': {
      return {
        title: messages.cameraNoDeviceTitle,
        note: messages.cameraNoDeviceNote,
      };
    }
    case 'busy': {
      return { title: messages.cameraBusyTitle, note: messages.cameraBusyNote };
    }
    case 'secure': {
      return {
        title: messages.cameraSecureTitle,
        note: messages.cameraSecureNote,
      };
    }
    default: {
      return { title: messages.cameraUnavailable, note: messages.manualNote };
    }
  }
}

/** Only these can end differently on a second try; http and no-camera cannot. */
function retryable(fault: CameraFault) {
  return fault === 'blocked' || fault === 'busy' || fault === 'unknown';
}

/** The paste field, in the card and in the camera panel: same form, two doors. */
function PasteForm({
  value,
  onChange,
  onJoin,
  busy,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onJoin: () => void;
  busy: boolean;
  autoFocus?: boolean;
}) {
  const { formatMessage } = useIntl();
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) onJoin();
      }}
    >
      <p className={note}>{formatMessage(messages.manualNote)}</p>
      <Field label={formatMessage(messages.manualToggle)}>
        {(id) => (
          <textarea
            id={id}
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={3}
            dir="ltr"
            // A deliberate focus: this form opens because the listener asked
            // to type the code, so the caret goes where they will type.
            autoFocus={autoFocus}
            placeholder={formatMessage(messages.manualPlaceholder)}
            name="pairing-ticket"
            autoComplete="off"
            className={cn(input, 'py-2 font-mono text-[14px]')}
          />
        )}
      </Field>
      <button type="submit" disabled={busy} className={primaryButton}>
        {busy ? <Spinner /> : null}
        {formatMessage(messages.manualAction)}
      </button>
    </form>
  );
}

/**
 * One half of the ring handshake.
 *
 * `share` shows a sealed ticket for a device that is already in the ring.
 * `scan` is the other side: a device with no key reads a ticket to join. The two
 * are never offered together, because a device that is already in the ring has
 * nothing to scan — it would only be trying to join a second ring.
 *
 * Both halves have a camera-less path. A desktop has no camera to point at a
 * phone, and a phone may refuse the permission, so the ticket can always be
 * copied as text and pasted on the other side.
 */
export default function LinkDevice({
  mode,
  onLinked,
  onCameraChange,
  onDeviceJoined,
}: {
  mode: Mode;
  onLinked: () => void;
  /** Lets the panel give the viewfinder its whole height. */
  onCameraChange?: (active: boolean) => void;
  /**
   * Share mode only: a device that was not in the ring when the code was drawn
   * has now registered. The row is the proof, so the popup closes on evidence
   * rather than on a timer or a hope.
   */
  onDeviceJoined?: (device: { id: string; name?: string }) => void;
}) {
  const { formatMessage } = useIntl();
  const { getPair, authWithPair } = useGun();
  // Already live for the panel: the same map the device list renders.
  const devices = useAtomValue(userDevicesAtom);

  const [qr, setQr] = useState<string | null>(null);
  const [ticketText, setTicketText] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [scanView, setScanView] = useState<ScanView | null>(null);
  const [fault, setFault] = useState<CameraFault | null>(null);
  const [opening, setOpening] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [manual, setManual] = useState(false);
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  /** A ticket was read and the relay is being asked for the envelope. */
  const [joining, setJoining] = useState(false);

  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const qrCloseRef = useRef<HTMLButtonElement>(null);
  /** Two decode callbacks in flight would redeem the same ticket twice. */
  const joiningRef = useRef(false);
  /** Device ids that already existed when this code was drawn. */
  const knownIds = useRef<string[]>([]);
  const announced = useRef(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    // `stop()` rejects when the scanner never started; the element still needs
    // emptying, or the next start inherits a stale <video>.
    try {
      await scanner.stop();
    } catch {
      // already stopped
    }
    try {
      scanner.clear();
    } catch {
      // the reader is gone
    }
  }, []);

  const leaveCamera = useCallback(async () => {
    // Leave first, stop after: the panel must not wait on the camera hardware.
    setScanView(null);
    setFault(null);
    setOpening(false);
    await stopScanner();
  }, [stopScanner]);

  useEffect(() => {
    onCameraChange?.(scanView !== null);
  }, [scanView, onCameraChange]);

  // Leaving the settings page mid-scan unmounts this panel: the camera has to
  // go off with it, not keep streaming into a detached node.
  useEffect(
    () => () => {
      void stopScanner();
    },
    [stopScanner]
  );

  // The countdown runs on the ticket's own expiry, not on a timer we own.
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setQr(null);
        setTicketText(null);
        setExpiresAt(null);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const finishJoin = useCallback(
    async (text: string) => {
      const ticket = parseTicket(text);
      if (!ticket) {
        setMessage(formatMessage(messages.manualInvalid));
        return false;
      }
      setBusy(true);
      try {
        const pair = await redeemTicket(ticket);
        const ack = await authWithPair(pair);
        if (ack.err) throw new Error(ack.err);
        // The panel owns the confirmation: the tab switch below unmounts this
        // component, so a message printed here would be rendered into nothing.
        setMessage(null);
        onLinked();
        return true;
      } catch (error) {
        setMessage(formatMessage(messages[pairingErrorMessage(error)]));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [authWithPair, formatMessage, onLinked]
  );

  /**
   * The scanner effect must not depend on `finishJoin`: it is rebuilt whenever
   * the panel re-renders, and a changed dep would stop the camera mid-scan.
   */
  const finishJoinRef = useRef(finishJoin);
  useEffect(() => {
    finishJoinRef.current = finishJoin;
  }, [finishJoin]);

  // Scrolling, not a toast: the join card sits above the fold, its message does not.
  useEffect(() => {
    if (message) messageRef.current?.scrollIntoView({ block: 'nearest' });
  }, [message]);

  /**
   * The camera is started from an effect, after the reader element is in the
   * document. Starting it from the click handler raced the render and the video
   * attached to a node that was about to be replaced.
   */
  useEffect(() => {
    if (scanView !== 'camera' || fault) return;
    let cancelled = false;

    void (async () => {
      // Plain http has no getUserMedia: do not download 120 kB to learn that.
      if (!hasCameraApi(navigator.mediaDevices)) {
        setFault('secure');
        return;
      }
      setOpening(true);
      try {
        // The decoder is ~120 kB and only ever runs on this screen.
        const { Html5Qrcode, Html5QrcodeSupportedFormats } =
          await import('html5-qrcode');
        if (cancelled) return;
        // Only QR is offered, so the decoder does not try every barcode format
        // on every frame.
        const scanner = new Html5Qrcode(READER_ID, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (width: number, height: number) => {
              const side = Math.floor(Math.min(width, height) * 0.75);
              return { width: side, height: side };
            },
            // The stream is not mirrored for an environment camera, so decoding
            // it twice as a flipped image only costs frames.
            disableFlip: true,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          async (text) => {
            const ticket = parseTicket(text);
            if (!ticket || joiningRef.current) return;
            joiningRef.current = true;
            setMessage(null);
            // Camera off first: the light should not stay on while a relay is
            // asked for the envelope. The reader node stays mounted, hidden.
            await stopScanner();
            setJoining(true);
            const ok = await finishJoinRef.current(text);
            setJoining(false);
            joiningRef.current = false;
            if (ok) await leaveCamera();
          },
          () => {
            // per-frame decode misses are normal, stay quiet
          }
        );
        if (!cancelled) setOpening(false);
      } catch (error) {
        if (cancelled) return;
        setOpening(false);
        // Keep the panel: a fault is a state of it, not a way out of it.
        setFault(classifyCameraError(error));
      }
    })();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [scanView, fault, attempt, leaveCamera, stopScanner]);

  const showTicket = async () => {
    setMessage(null);
    setCopied(false);
    // Who is already in the ring: any id that appears after this point was not,
    // and that row is the evidence the pairing worked. No handshake needed.
    knownIds.current = Object.keys(devices).filter(
      (id) => id !== 'meta' && id !== '_' && Boolean(devices[id]?.id)
    );
    announced.current = false;
    try {
      const pair = getPair();
      if (!pair) throw new Error('Sign in on this device first');
      const ticket = await createPairingTicket(pair);
      const text = encodeTicket(ticket);
      // ~50 kB of QR encoder, only for the one screen that draws a code.
      const { default: QRCode } = await import('qrcode');
      // The spec quiet zone is four modules; `margin: 1` left a code that a
      // camera had to be very close to read. 320 px of source drawn at 280
      // keeps the modules crisp on a phone screen.
      setQr(
        await QRCode.toDataURL(text, {
          errorCorrectionLevel: 'M',
          margin: 3,
          width: 320,
        })
      );
      setTicketText(text);
      setExpiresAt(ticket.exp);
    } catch {
      setMessage(formatMessage(messages.codeFailed));
    }
  };

  /**
   * The code is closed by the ring, not by a timer: when a device that was not
   * in the map when the code was drawn registers itself, the other person is
   * done, and the popup has no reason to stay.
   */
  useEffect(() => {
    if (!qr || announced.current) return;
    const joined = Object.entries(devices).find(
      ([id, row]) =>
        id !== 'meta' &&
        id !== '_' &&
        Boolean(row?.id) &&
        !knownIds.current.includes(id)
    );
    if (!joined) return;
    announced.current = true;
    setQr(null);
    setTicketText(null);
    setExpiresAt(null);
    onDeviceJoined?.({ id: joined[0], name: joined[1]?.name });
  }, [devices, qr, onDeviceJoined]);

  // The popup is the only thing on screen while it is up: its close button takes
  // focus, and Escape dismisses the code rather than the page behind it.
  useEffect(() => {
    if (!qr) return;
    qrCloseRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      setQr(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [qr]);

  const retryScan = () => {
    setMessage(null);
    setFault(null);
    setJoining(false);
    setScanView('camera');
    setAttempt((count) => count + 1);
  };

  const copyTicket = async () => {
    if (!ticketText) return;
    try {
      await navigator.clipboard.writeText(ticketText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage(formatMessage(messages.copyFailed));
    }
  };

  const openPaste = () => {
    setFault(null);
    setScanView('paste');
  };

  // The camera owns the panel: the viewfinder sits in the visible area instead of
  // below a fold the listener has to discover. A failure is shown *in* it, so the
  // layout never jumps out from under the finger.
  if (scanView) {
    const shown = fault ? faultCopy(fault) : null;

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className={cardTitle}>{formatMessage(messages.scanTitle)}</p>
          <button
            type="button"
            onClick={() => void leaveCamera()}
            className="min-h-11 rounded-full border border-border px-3 text-[13px] text-ink transition-colors hover:bg-surface-sunken"
          >
            {formatMessage(
              scanView === 'camera' && !fault && !joining
                ? messages.scanStop
                : messages.scanBack
            )}
          </button>
        </div>

        {/*
          Kept mounted and only hidden: the decoder holds a live <video> here, and
          removing the node under it leaves the stream running.
        */}
        <div
          id={READER_ID}
          className={cn(
            'relative min-h-0 w-full flex-1 overflow-hidden rounded-[12px] bg-black',
            '[&_video]:h-full [&_video]:w-full [&_video]:object-cover',
            scanView !== 'camera' || fault || joining || Boolean(message)
              ? 'hidden'
              : undefined
          )}
        />

        {shown ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border border-border p-4 text-center">
            <div role="status" className="space-y-2">
              <p className={cardTitle}>{formatMessage(shown.title)}</p>
              <p className={cn(note, 'max-w-[34ch]')}>
                {formatMessage(shown.note)}
              </p>
            </div>
            <button
              type="button"
              onClick={openPaste}
              className={cn(primaryButton, 'mt-3')}
            >
              {formatMessage(messages.manualToggle)}
            </button>
            {fault && retryable(fault) ? (
              <button
                type="button"
                onClick={() => {
                  setFault(null);
                  setOpening(false);
                  setAttempt((count) => count + 1);
                }}
                className={quietButton}
              >
                {formatMessage(messages.cameraRetry)}
              </button>
            ) : null}
          </div>
        ) : scanView === 'paste' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PasteForm
              value={pasted}
              onChange={setPasted}
              onJoin={() => void finishJoin(pasted.trim())}
              busy={busy}
              autoFocus
            />
          </div>
        ) : joining ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3"
          >
            <Spinner size={24} />
            <p className="text-[14px] text-ink">
              {formatMessage(messages.scanJoining)}
            </p>
          </div>
        ) : (
          <>
            <p className={cn(note, 'text-center')}>
              {formatMessage(
                opening ? messages.scanOpening : messages.scanHint
              )}
            </p>
            <button
              type="button"
              onClick={openPaste}
              className="min-h-11 text-center text-[13px] text-ink-muted underline underline-offset-2"
            >
              {formatMessage(messages.manualToggle)}
            </button>
          </>
        )}

        {message ? (
          <div className="space-y-2 text-center">
            <p role="alert" className="text-[13px] text-danger">
              {message}
            </p>
            {scanView === 'camera' && !joining ? (
              <button
                type="button"
                onClick={retryScan}
                className={primaryButton}
              >
                {formatMessage(messages.scanAgain)}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mode === 'share' ? (
        <div className={card}>
          <p className={cardTitle}>{formatMessage(messages.shareTitle)}</p>
          <p className={cn(note, 'mt-1')}>
            {formatMessage(messages.shareNote)}
          </p>
          <button
            type="button"
            onClick={() => void showTicket()}
            className={cn(primaryButton, 'mt-3')}
          >
            {formatMessage(messages.showCode)}
          </button>
        </div>
      ) : (
        <div className={card}>
          <p className={cardTitle}>{formatMessage(messages.joinTitle)}</p>
          <p className={cn(note, 'mt-1')}>{formatMessage(messages.joinNote)}</p>
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setFault(null);
              setScanView('camera');
            }}
            className={cn(primaryButton, 'mt-3')}
          >
            {formatMessage(messages.scanStart)}
          </button>
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setManual((open) => !open);
            }}
            aria-expanded={manual}
            className={cn(quietButton, 'mt-2')}
          >
            {formatMessage(messages.manualToggle)}
          </button>

          {manual ? (
            <div className="mt-2 border-t border-border pt-3">
              <PasteForm
                value={pasted}
                onChange={setPasted}
                onJoin={() => void finishJoin(pasted.trim())}
                busy={busy}
              />
            </div>
          ) : null}
        </div>
      )}

      {message ? (
        <p ref={messageRef} role="alert" className="text-[13px] text-danger">
          {message}
        </p>
      ) : null}

      {/*
        The code is a popup, not a block inside the panel: it is the one thing
        the other person has to point a camera at, so it gets the middle of the
        screen at a size a phone camera can read.
      */}
      {qr ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pairing-code-title"
          aria-describedby="pairing-code-expiry"
          onClick={() => setQr(null)}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-6"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[340px] rounded-[16px] border border-border bg-surface p-4 text-center"
          >
            <p id="pairing-code-title" className={cardTitle}>
              {formatMessage(messages.shareTitle)}
            </p>
            {/* A data URL drawn once: next/image has nothing to optimise. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qr}
              alt={formatMessage(messages.shareTitle)}
              width={280}
              height={280}
              className="mx-auto mt-3 rounded-[10px] bg-white p-2"
            />
            <p id="pairing-code-expiry" className={cn(note, 'mt-2')}>
              {formatMessage(messages.expiresIn, { seconds: secondsLeft })}
            </p>
            <p className="mt-2 text-start text-[13px] leading-5 text-warning">
              {formatMessage(messages.shareWarning)}
            </p>
            <button
              type="button"
              onClick={() => void copyTicket()}
              className={cn(secondaryButton, 'mt-3')}
            >
              {formatMessage(copied ? messages.copied : messages.copyCode)}
            </button>
            <button
              type="button"
              onClick={() => void showTicket()}
              className={cn(quietButton, 'mt-2 text-ink')}
            >
              {formatMessage(messages.newCode)}
            </button>
            <button
              type="button"
              ref={qrCloseRef}
              onClick={() => setQr(null)}
              className={cn(quietButton, 'mt-1')}
            >
              {formatMessage({ id: 'close', defaultMessage: 'Close' })}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
