import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { TimeRange } from '@/hooks/use-tahfeez-session';
import type { LinkSource } from '@/types';

export interface TahfeezSettings {
  fromAyah: number;
  toAyah: number;
  repeat: number;
  delay: number;
  strategy: 'per_ayah' | 'whole_range';
}

interface TahfeezModeControlsProps {
  tahfeezSettings: TahfeezSettings;
  setTahfeezSettings: React.Dispatch<React.SetStateAction<TahfeezSettings>>;
  source?: LinkSource;
  moshafId?: string;
  chapterNumber?: number;
  /** Called whenever the computed ranges change (segments loaded, settings changed). */
  onRangesReady?: (_ranges: TimeRange[]) => void;
  /** Called on unmount so the parent can stop audio and tear down the session. */
  onCleanup?: () => void;
}

interface Segment {
  ayah: number;
  startMs: number;
  endMs: number;
}

const INPUT_CLASS =
  'w-20 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary';
const LABEL_CLASS = 'text-xs text-ink-muted';

// Tahfeez Mode Controls Component
export default function TahfeezModeControls({
  tahfeezSettings,
  setTahfeezSettings,
  source,
  moshafId,
  chapterNumber,
  onRangesReady,
  onCleanup,
}: TahfeezModeControlsProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoadingTimestamps, setIsLoadingTimestamps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formatMessage } = useIntl();
  const onCleanupRef = useRef(onCleanup);
  const ids = useId();

  useEffect(() => {
    onCleanupRef.current = onCleanup;
  }, [onCleanup]);

  const fetchTimestamps = useCallback(
    async (signal?: AbortSignal) => {
      if (!source || !moshafId || !chapterNumber) return;
      setIsLoadingTimestamps(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/timings/${encodeURIComponent(source)}/${encodeURIComponent(
            moshafId
          )}/${chapterNumber}`,
          { signal }
        );
        if (!response.ok)
          throw new Error(`Failed to fetch timings: ${response.status}`);

        const json: {
          timings?: Array<{ ayah: number; startMs: number; endMs: number }>;
        } = await response.json();
        const next = (json.timings ?? [])
          .map((timing) => ({
            ayah: timing.ayah,
            startMs: timing.startMs,
            endMs: timing.endMs,
          }))
          .sort((a, b) => a.ayah - b.ayah);

        previousRangesRef.current = '';
        setSegments(next);
        if (next.length === 0) {
          setError(formatMessage({ id: 'tahfeez.noTimings' }));
        }
      } catch (error) {
        if (signal?.aborted) return;
        setError(formatMessage({ id: 'tahfeez.errorTimestamps' }));
        console.warn('Failed to load tahfeez timings', error);
      } finally {
        if (!signal?.aborted) setIsLoadingTimestamps(false);
      }
    },
    [source, moshafId, chapterNumber, formatMessage]
  );

  // Stop player and cancel tahfeez seek on unmount (e.g mode switched to listening)
  useEffect(() => {
    return () => {
      onCleanupRef.current?.();
    };
  }, []);

  // Fetch timings when the provider, moshaf, or chapter changes.
  useEffect(() => {
    if (!source || !moshafId || !chapterNumber) return;
    const controller = new AbortController();
    void fetchTimestamps(controller.signal);
    return () => controller.abort();
  }, [source, moshafId, chapterNumber, fetchTimestamps]);

  // Clamp the range to the actual ayah count of this surah.
  useEffect(() => {
    if (segments.length === 0) return;
    const lastAyah = segments.at(-1)?.ayah ?? 1;
    setTahfeezSettings((previous) => {
      const fromAyah = Math.min(Math.max(previous.fromAyah, 1), lastAyah);
      const toAyah = Math.min(Math.max(previous.toAyah, 1), lastAyah);
      if (fromAyah === previous.fromAyah && toAyah === previous.toAyah) {
        return previous;
      }
      return { ...previous, fromAyah, toAyah };
    });
  }, [segments, setTahfeezSettings]);

  /** Compute flat TimeRange array from current segments + settings. Returns null on invalid input. */
  const computeRanges = useCallback(
    (
      fromAyah: number,
      toAyah: number,
      strategy: 'per_ayah' | 'whole_range'
    ): TimeRange[] | null => {
      if (!fromAyah || !toAyah || fromAyah > toAyah || segments.length === 0)
        return null;

      const selectedSegments = segments
        .filter((segment) => segment.ayah >= fromAyah && segment.ayah <= toAyah)
        .sort((a, b) => a.ayah - b.ayah);
      if (selectedSegments.length === 0) return null;

      if (strategy === 'per_ayah') {
        return selectedSegments.map((seg) => ({
          startTime: seg.startMs / 1000,
          endTime: seg.endMs / 1000,
        }));
      }

      const firstSeg = selectedSegments.at(0);
      const lastSeg = selectedSegments.at(-1);
      if (!firstSeg || !lastSeg) return null;

      return [
        {
          startTime: firstSeg.startMs / 1000,
          endTime: lastSeg.endMs / 1000,
        },
      ];
    },
    [segments]
  );

  const previousRangesRef = useRef<string>('');

  // Emit updated ranges whenever segments or relevant settings change
  useEffect(() => {
    if (!onRangesReady || segments.length === 0) return;
    const ranges = computeRanges(
      tahfeezSettings.fromAyah,
      tahfeezSettings.toAyah,
      tahfeezSettings.strategy
    );
    if (ranges) {
      const rangesString = JSON.stringify(ranges);
      if (previousRangesRef.current !== rangesString) {
        previousRangesRef.current = rangesString;
        onRangesReady(ranges);
      }
    }
  }, [
    segments,
    tahfeezSettings.fromAyah,
    tahfeezSettings.toAyah,
    tahfeezSettings.strategy,
    computeRanges,
    onRangesReady,
  ]);

  const lastAyah = segments.at(-1)?.ayah ?? 114;
  const invalidRange = tahfeezSettings.fromAyah > tahfeezSettings.toAyah;
  const fromId = `${ids}-from`;
  const toId = `${ids}-to`;
  const repeatId = `${ids}-repeat`;
  const delayId = `${ids}-delay`;

  return (
    <div className="flex w-full flex-col">
      {/* Settings inputs: 2x2 on mobile, one row from sm up */}
      <div className="mb-3 grid w-full grid-cols-2 items-end justify-items-center gap-3 px-2 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-1">
          <label htmlFor={fromId} className={LABEL_CLASS}>
            {formatMessage({ id: 'tahfeez.fromAyah' })}
          </label>
          <input
            id={fromId}
            type="number"
            value={tahfeezSettings.fromAyah}
            onChange={(e) => {
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 1, 1),
                lastAyah
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                fromAyah: value,
              }));
            }}
            min={1}
            max={lastAyah}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor={toId} className={LABEL_CLASS}>
            {formatMessage({ id: 'tahfeez.toAyah' })}
          </label>
          <input
            id={toId}
            type="number"
            value={tahfeezSettings.toAyah}
            onChange={(e) => {
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 1, 1),
                lastAyah
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                toAyah: value,
              }));
            }}
            min={1}
            max={lastAyah}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor={repeatId} className={LABEL_CLASS}>
            {formatMessage({ id: 'tahfeez.repeat' })}
          </label>
          <input
            id={repeatId}
            type="number"
            value={tahfeezSettings.repeat}
            onChange={(e) => {
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 1, 1),
                100
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                repeat: value,
              }));
            }}
            min={1}
            max={100}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <label htmlFor={delayId} className={LABEL_CLASS}>
            {formatMessage({ id: 'tahfeez.delay' })}
          </label>
          <input
            id={delayId}
            type="number"
            value={tahfeezSettings.delay}
            onChange={(e) => {
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 0, 0),
                60
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                delay: value,
              }));
            }}
            min={0}
            max={60}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* Quick presets */}
      <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-2 px-2 text-xs">
        <span className={LABEL_CLASS}>
          {formatMessage({ id: 'tahfeez.repeat' })}
        </span>
        {[3, 5, 7, 10].map((value) => (
          <button
            key={`repeat-${value}`}
            type="button"
            aria-pressed={tahfeezSettings.repeat === value}
            onClick={() =>
              setTahfeezSettings((previous) => ({
                ...previous,
                repeat: value,
              }))
            }
            className={`rounded-md border px-2 py-0.5 font-medium transition-colors ${
              tahfeezSettings.repeat === value
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            {value}×
          </button>
        ))}
        <span className={`${LABEL_CLASS} ms-2`}>
          {formatMessage({ id: 'tahfeez.delay' })}
        </span>
        {[0, 1, 2, 3].map((value) => (
          <button
            key={`delay-${value}`}
            type="button"
            aria-pressed={tahfeezSettings.delay === value}
            onClick={() =>
              setTahfeezSettings((previous) => ({
                ...previous,
                delay: value,
              }))
            }
            className={`rounded-md border px-2 py-0.5 font-medium transition-colors ${
              tahfeezSettings.delay === value
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink'
            }`}
          >
            {value}s
          </button>
        ))}
      </div>

      {/* Strategy selector */}
      <div className="mb-4 flex w-full justify-center">
        <div
          role="radiogroup"
          aria-label={formatMessage({ id: 'tahfeez.strategy' })}
          className="flex rounded-lg bg-surface-sunken p-1"
        >
          <button
            type="button"
            role="radio"
            aria-checked={tahfeezSettings.strategy === 'per_ayah'}
            onClick={() => {
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'per_ayah',
              }));
            }}
            className={`rounded-[8px] border px-4 py-1.5 text-sm font-bold transition-colors duration-120 ${
              tahfeezSettings.strategy === 'per_ayah'
                ? 'border-border bg-surface text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {formatMessage({ id: 'tahfeez.perAyah' })}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tahfeezSettings.strategy === 'whole_range'}
            onClick={() => {
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'whole_range',
              }));
            }}
            className={`rounded-[8px] border px-4 py-1.5 text-sm font-bold transition-colors duration-120 ${
              tahfeezSettings.strategy === 'whole_range'
                ? 'border-border bg-surface text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {formatMessage({ id: 'tahfeez.wholeRange' })}
          </button>
        </div>
      </div>

      {/* Loading / error feedback */}
      <div aria-live="polite">
        {isLoadingTimestamps && (
          <div className="mb-4 text-center text-sm text-ink-muted">
            {formatMessage({ id: 'tahfeez.loading' })}
          </div>
        )}
      </div>
      {invalidRange && (
        <div role="alert" className="mb-4 text-center text-sm text-danger">
          {formatMessage({ id: 'tahfeez.invalidRange' })}
        </div>
      )}
      {error && !isLoadingTimestamps && (
        <div role="alert" className="mb-4 text-center text-sm text-danger">
          {error}
        </div>
      )}

      {/* Range indicator */}
      {segments.length > 0 && (
        <div className="relative inset-0 my-3 flex h-1 w-full items-center justify-between">
          <div className="absolute h-1 w-full rounded-full bg-surface-sunken" />
        </div>
      )}

      {/* Status summary */}
      {segments.length > 0 && !error && !invalidRange && (
        <div className="mt-3 flex flex-col items-center justify-center gap-1">
          <div className="text-sm font-medium text-success">
            {formatMessage({ id: 'tahfeez.readyToStart' })}
          </div>
          <div className="flex items-center gap-2 font-bold text-ink-muted">
            <span aria-live="polite">
              {formatMessage(
                { id: 'tahfeez.statusSummary' },
                {
                  from: tahfeezSettings.fromAyah,
                  to: tahfeezSettings.toAyah,
                  repeat: tahfeezSettings.repeat,
                  delay: tahfeezSettings.delay,
                }
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
