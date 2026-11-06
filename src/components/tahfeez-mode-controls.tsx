import { useCallback, useEffect, useRef, useState } from 'react';
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
  /**  Compute flat TimeRange array from current segments + settings. Returns null on invalid input. */
  const computeRanges = useCallback(
    (
      fromAyah: number,
      toAyah: number,
      strategy: 'per_ayah' | 'whole_range'
    ): TimeRange[] | null => {
      if (!fromAyah || !toAyah || segments.length === 0) return null;

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

  return (
    <div className="flex w-full flex-col">
      {/* Settings inputs */}
      <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-3 px-2">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage({ id: 'tahfeez.fromAyah' })}
          </span>
          <input
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
              onCleanup?.();
            }}
            min={1}
            max={lastAyah}
            className="w-20 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage({ id: 'tahfeez.toAyah' })}
          </span>
          <input
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
              onCleanup?.();
            }}
            min={1}
            max={lastAyah}
            className="w-20 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage({ id: 'tahfeez.repeat' })}
          </span>
          <input
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
              onCleanup?.();
            }}
            min={1}
            max={100}
            className="w-20 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage({ id: 'tahfeez.delay' })}
          </span>
          <input
            type="number"
            value={tahfeezSettings.delay}
            onChange={(e) => {
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 0, 0),
                60
              );
              setTahfeezSettings((previous) => ({ ...previous, delay: value }));
              onCleanup?.();
            }}
            min={0}
            max={60}
            className="w-20 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Strategy selector */}
      <div className="mb-4 flex w-full justify-center">
        <div className="flex rounded-lg bg-gray-200 p-1 dark:bg-gray-800">
          <button
            onClick={() => {
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'per_ayah',
              }));
              onCleanup?.();
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tahfeezSettings.strategy === 'per_ayah'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            {formatMessage({ id: 'tahfeez.perAyah' })}
          </button>
          <button
            onClick={() => {
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'whole_range',
              }));
              onCleanup?.();
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tahfeezSettings.strategy === 'whole_range'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            {formatMessage({ id: 'tahfeez.wholeRange' })}
          </button>
        </div>
      </div>

      {/* Loading / error feedback */}
      {isLoadingTimestamps && (
        <div className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
          {formatMessage({ id: 'tahfeez.loading' })}
        </div>
      )}
      {error && (
        <div className="mb-4 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Range indicator */}
      {segments.length > 0 && (
        <div className="relative inset-0 my-3 flex h-1 w-full items-center justify-between">
          <div className="absolute h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      {/* Status summary */}
      <div className="mt-3 flex flex-col items-center justify-center gap-1">
        <div className="text-sm font-medium text-green-600 dark:text-green-400">
          {formatMessage({ id: 'tahfeez.readyToStart' })}
        </div>
        <div className="flex items-center gap-2 font-bold text-gray-500">
          <span>
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
    </div>
  );
}
