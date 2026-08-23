import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { TimeRange } from '@/hooks/use-tahfeez-session';

export type TahfeezSettings = {
  fromAyah: number;
  toAyah: number;
  repeat: number;
  delay: number;
  strategy: 'per_ayah' | 'whole_range';
};

interface TahfeezModeControlsProps {
  tahfeezSettings: TahfeezSettings;
  setTahfeezSettings: React.Dispatch<React.SetStateAction<TahfeezSettings>>;
  reciterId?: number;
  chapterNumber?: number;
  /** Called whenever the computed ranges change (segments loaded, settings changed). */
  onRangesReady?: (ranges: TimeRange[]) => void;
  /** Called on unmount so the parent can stop audio and tear down the session. */
  onCleanup?: () => void;
}

type Segment = {
  surah: string;
  ayah: number;
  audioSource: string;
  duration: number;
  startMs: number;
  endMs: number;
};

// Tahfeez Mode Controls Component
export default function TahfeezModeControls({
  tahfeezSettings,
  setTahfeezSettings,
  reciterId,
  chapterNumber,
  onRangesReady,
  onCleanup,
}: TahfeezModeControlsProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoadingTimestamps, setIsLoadingTimestamps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formatMessage } = useIntl();

  const fetchTimestamps = useCallback(async () => {
    if (!reciterId || !chapterNumber) return;
    setIsLoadingTimestamps(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tahfeez/quran-foundation/${reciterId}/${chapterNumber}`
      );
      if (!response.ok)
        throw new Error(`Failed to fetch timestamps: ${response.status}`);
      const json = await response.json();
      setSegments(json.segments || []);
    } catch (_error) {
      setError(formatMessage({ id: 'tahfeez.errorTimestamps' }));
    } finally {
      setIsLoadingTimestamps(false);
    }
  }, [reciterId, chapterNumber, formatMessage]);

  // Stop player and cancel tahfeez seek on unmount (e.g. mode switched to listening)
  useEffect(() => {
    return () => {
      onCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch timestamps when reciter or chapter changes
  useEffect(() => {
    if (reciterId && chapterNumber) {
      void fetchTimestamps();
    }
  }, [reciterId, chapterNumber, fetchTimestamps]);

  /**  Compute flat TimeRange array from current segments + settings. Returns null on invalid input. */
  const computeRanges = useCallback(
    (
      fromAyah: number,
      toAyah: number,
      strategy: 'per_ayah' | 'whole_range'
    ): TimeRange[] | null => {
      if (!fromAyah || !toAyah || segments.length === 0) return null;

      if (strategy === 'per_ayah') {
        const ranges: TimeRange[] = [];
        for (let index = fromAyah - 1; index < toAyah; index++) {
          ranges.push({
            startTime: segments[index].startMs / 1000,
            endTime: segments[index].endMs / 1000,
          });
        }
        return ranges;
      }

      return [
        {
          startTime: segments[fromAyah - 1].startMs / 1000,
          endTime: segments[toAyah - 1].endMs / 1000,
        },
      ];
    },
    [segments]
  );

  // Emit updated ranges whenever segments or relevant settings change
  useEffect(() => {
    if (!onRangesReady || segments.length === 0) return;
    const ranges = computeRanges(
      tahfeezSettings.fromAyah,
      tahfeezSettings.toAyah,
      tahfeezSettings.strategy
    );
    if (ranges) onRangesReady(ranges);
  }, [
    segments,
    tahfeezSettings.fromAyah,
    tahfeezSettings.toAyah,
    tahfeezSettings.strategy,
    computeRanges,
    onRangesReady,
  ]);

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
            value={tahfeezSettings.fromAyah ?? 1}
            onChange={(e) => {
              const max = segments.length > 0 ? segments.length - 1 : Infinity;
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 1, 1),
                max
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                fromAyah: value,
              }));
            }}
            min={1}
            max={segments.length - 1}
            className="w-20 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessage({ id: 'tahfeez.toAyah' })}
          </span>
          <input
            type="number"
            value={tahfeezSettings.toAyah ?? 5}
            onChange={(e) => {
              const max = segments.length > 0 ? segments.length : Infinity;
              const value = Math.min(
                Math.max(parseInt(e.target.value) || 1, 1),
                max
              );
              setTahfeezSettings((previous) => ({
                ...previous,
                toAyah: value,
              }));
            }}
            min={1}
            max={segments.length}
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
            onClick={() =>
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'per_ayah',
              }))
            }
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tahfeezSettings.strategy === 'per_ayah'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-300 dark:text-gray-400 dark:hover:bg-gray-600'
            }`}
          >
            {formatMessage({ id: 'tahfeez.perAyah' })}
          </button>
          <button
            onClick={() =>
              setTahfeezSettings((previous) => ({
                ...previous,
                strategy: 'whole_range',
              }))
            }
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
