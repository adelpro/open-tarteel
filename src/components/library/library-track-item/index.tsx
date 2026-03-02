'use client';

import { ArrowDown, Clock, HardDrive } from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { StatusBadge } from '@/components/library/status-badge';
import TrackActions from '@/components/library/track-actions';
import { Progress } from '@/components/ui/progress';
import { DOWNLOAD_STATUS } from '@/constants';
import {
  formatBytes,
  formatTime,
  getContainerVariant,
  getMessageConfig as t,
  getSurahName,
  getTrackFlags,
} from '@/helpers';
import useDirection from '@/hooks/use-direction';
import { LocaleType, Track } from '@/types';
import { cn } from '@/utils';

interface Props {
  track: Track;
  onPlay?: (track: Track) => void;
  onPause?: (track: Track) => void;
  onResume?: (track: Track) => void;
  onRetry?: (track: Track) => void;
  onCancel?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  onDownLoad?: (track: Track, resume?: boolean) => Promise<void>;
}

export function LibraryTrackItem({ track, onPlay }: Readonly<Props>) {
  const { formatMessage } = useIntl();
  const { dir, locale } = useDirection();

  const [playLoading, setPlayLoading] = useState(false);
  const flags = getTrackFlags(track);
  const containerVariant = getContainerVariant(flags);

  const isDone = track.status === DOWNLOAD_STATUS.DONE;
  const isDownloading = track.status === DOWNLOAD_STATUS.DOWNLOADING;
  const isPaused = track.status === DOWNLOAD_STATUS.PAUSED;
  const isError = track.status === DOWNLOAD_STATUS.ERROR;
  const isIdle = track.status === DOWNLOAD_STATUS.IDLE;
  const hasPartial =
    track.downloadedBytes > 0 && track.downloadedBytes < track.totalBytes;

  const surahName = getSurahName(track, locale as LocaleType);

  const handlePlay = (track: Track) => {
    if (!onPlay) return;
    setPlayLoading(true);
    try {
      onPlay(track);
    } finally {
      setPlayLoading(false);
    }
  };

  return (
    <article
      // FIXME:
      dir={dir}
      className={cn(
        'group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200',
        containerVariant
      )}
    >
      {/* Track Number */}
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
          {
            'bg-success/10 text-success': isDone,
            'bg-destructive/10 text-destructive': isError,
            'bg-secondary text-muted-foreground': !isDone && !isError,
          }
        )}
      >
        {track.surahId}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {surahName}
          </span>
          <StatusBadge status={track.status} />
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {track.reciterName && (
            <span className="truncate">{track.reciterName}</span>
          )}
          {track.moshafName && (
            <span className="opacity-60">{track.moshafName}</span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/70">
          {track.duration != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatTime(track.duration)}
            </span>
          )}
          {track.totalBytes > 0 && (
            <span className="inline-flex items-center gap-1">
              <HardDrive className="size-3" />
              {formatBytes(track.totalBytes)}
            </span>
          )}
          {hasPartial && (
            <span className="inline-flex items-center gap-1 text-primary">
              <ArrowDown className="size-3" />
              {formatBytes(track.downloadedBytes)} /{' '}
              {formatBytes(track.totalBytes)}
            </span>
          )}
          {isDownloading && track.speed != null && (
            <span className="font-medium text-primary">{track.speed} KB/s</span>
          )}
        </div>

        {/* Progress bar */}
        {(isDownloading || isPaused) && (
          <div className="mt-1 flex items-center gap-2">
            <Progress
              value={track.progress}
              className={cn(
                'h-1.5 flex-1',
                isPaused
                  ? '[&>[data-slot=progress-indicator]]:bg-warning'
                  : '[&>[data-slot=progress-indicator]]:bg-primary'
              )}
            />
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {track.progress}%
            </span>
          </div>
        )}

        {/* Error message */}
        {isError && (
          <p className="mt-0.5 text-[11px] text-destructive">
            {formatMessage(t('library.status.downloadFailed'))}
          </p>
        )}

        {/* Partial hint */}
        {isIdle && hasPartial && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatMessage(t('library.status.partialSaved'))}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <TrackActions
          track={track}
          flags={flags}
          onPlay={onPlay}
          playLoading={playLoading}
          handlePlay={handlePlay}
        />
      </div>
    </article>
  );
}
