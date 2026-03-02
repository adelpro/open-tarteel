import { DOWNLOAD_STATUS } from '@/constants';
import type { LocaleType, Track, TrackFlagsType } from '@/types';

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);

  if (minutes > 0) parts.push(`${minutes}m`);

  parts.push(`${seconds}s`);

  return parts.join(' ');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSurahName(track: Track, locale: LocaleType) {
  return locale === 'ar' ? track.surahName : track.surahNameEn;
}

export function getTrackFlags(track: Track): TrackFlagsType {
  const { downloadedBytes, totalBytes } = track;
  const isDone = track.status === DOWNLOAD_STATUS.DONE;
  const isDownloading = track.status === DOWNLOAD_STATUS.DOWNLOADING;
  const isPaused = track.status === DOWNLOAD_STATUS.PAUSED;
  const isError = track.status === DOWNLOAD_STATUS.ERROR;
  const isIdle = track.status === DOWNLOAD_STATUS.IDLE;
  const isUpdating = track.status === DOWNLOAD_STATUS.UPDATING;

  const hasPartial = downloadedBytes > 0 && downloadedBytes < totalBytes;
  const canResume = isPaused || (isIdle && hasPartial);

  return {
    isDone,
    isDownloading,
    isPaused,
    isError,
    isIdle,
    isUpdating,
    hasPartial,
    canResume,
  };
}

export function getContainerVariant(flags: ReturnType<typeof getTrackFlags>) {
  if (flags.isDone) return 'border-success/15 bg-success/[0.03]';
  if (flags.isError) return 'border-destructive/15 bg-destructive/[0.03]';
  if (flags.isDownloading || flags.isUpdating)
    return 'border-primary/15 bg-primary/[0.03]';
  if (flags.isPaused) return 'border-warning/15 bg-warning/[0.03]';

  return 'border-border bg-card';
}
