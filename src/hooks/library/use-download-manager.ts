'use client';

import { useSetAtom } from 'jotai';
import { useCallback } from 'react';

import { DOWNLOAD_STATUS, SW_EVENTS } from '@/constants';
import { getSW, openChannel, toSWTrackMeta } from '@/helpers';
import {
  recentTracksMetaAtom,
  removeLibraryTrackAtom,
  upsertLibraryTrackAtom,
} from '@/jotai/library-atoms';
import {
  removeFromRecent,
  removeTrackFromCache,
  upsertTrackInCache,
} from '@/lib/tracks/storage';
import type { Track } from '@/types';

export function useDownloadManager() {
  const upsert = useSetAtom(upsertLibraryTrackAtom);
  const remove = useSetAtom(removeLibraryTrackAtom);
  const setRecentMetas = useSetAtom(recentTracksMetaAtom);

  const syncTrack = useCallback(
    async (track: Track) => {
      upsert(track);
      await upsertTrackInCache(track);
    },
    [upsert]
  );

  const startDownload = useCallback(
    async (track: Track, resume = false) => {
      const sw = await getSW();
      if (!sw) return;

      // Set status optimistically before SW responds
      await syncTrack({
        ...track,
        status: DOWNLOAD_STATUS.DOWNLOADING,
        addedAt: track.addedAt || Date.now(),
      });

      const { port, cleanup } = openChannel(sw, {
        type: resume ? SW_EVENTS.RESUME_DOWNLOAD : SW_EVENTS.DOWNLOAD_TRACK,
        ...toSWTrackMeta(track),
      });

      port.addEventListener('message', async (e: MessageEvent) => {
        const d = e.data;

        if ('type' in d && d.type === SW_EVENTS.DOWNLOAD_PROGRESS) {
          await syncTrack({
            ...track,
            status: DOWNLOAD_STATUS.DOWNLOADING,
            progress: d.progress ?? 0,
            speed: d.speed ?? 0,
            downloadedBytes: d.downloadedBytes ?? 0,
            totalBytes: d.totalBytes ?? track.totalBytes,
          });
          return;
        }

        if ('success' in d && d.success === true) {
          cleanup();
          await syncTrack({
            ...track,
            status: DOWNLOAD_STATUS.DONE,
            progress: 100,
          });
          return;
        }

        if ('success' in d && d.success === false) {
          cleanup();
          await syncTrack({ ...track, status: DOWNLOAD_STATUS.ERROR });
          return;
        }

        if ('paused' in d && d.paused) {
          cleanup();
          await syncTrack({ ...track, status: DOWNLOAD_STATUS.PAUSED });
          return;
        }

        if ('canceled' in d && d.canceled) {
          cleanup();
          await syncTrack({
            ...track,
            status: DOWNLOAD_STATUS.IDLE,
            progress: 0,
            downloadedBytes: 0,
          });
        }
      });
      port.start();
    },
    [syncTrack]
  );

  const pause = useCallback(
    async (track: Track) => {
      const sw = await getSW();
      if (!sw) return;
      const { cleanup } = openChannel(sw, {
        type: SW_EVENTS.PAUSE_DOWNLOAD,
        id: track.id,
      });

      setTimeout(cleanup, 3000);

      await syncTrack({ ...track, status: DOWNLOAD_STATUS.PAUSED });
    },
    [syncTrack]
  );

  const resume = useCallback(
    (track: Track) => startDownload(track, true),
    [startDownload]
  );

  const retry = useCallback(
    (track: Track) =>
      startDownload({ ...track, progress: 0, downloadedBytes: 0 }, false),
    [startDownload]
  );

  const cancel = useCallback(
    async (track: Track) => {
      const sw = await getSW();
      if (!sw) return;

      const { cleanup } = openChannel(sw, {
        type: SW_EVENTS.CANCEL_DOWNLOAD,
        id: track.id,
      });

      setTimeout(cleanup, 3000);

      await syncTrack({
        ...track,
        status: DOWNLOAD_STATUS.IDLE,
        progress: 0,
        downloadedBytes: 0,
      });
    },
    [syncTrack]
  );

  // Removes audio bytes from SW. Track stays in library as IDLE.
  const clearFromDownloads = useCallback(
    async (track: Track) => {
      const sw = await getSW();
      // Tell SW to delete audio bytes only (not the track record)

      if (!sw) return;
      const { cleanup } = openChannel(sw, {
        type: SW_EVENTS.CLEAR_AUDIO,
        id: track.id,
      });
      setTimeout(cleanup, 3000);
      await syncTrack({
        ...track,
        status: DOWNLOAD_STATUS.IDLE,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
    },
    [syncTrack]
  );

  const removeFromLibrary = useCallback(
    async (track: Track) => {
      const sw = await getSW();
      if (!sw) return;
      const { cleanup } = openChannel(sw, {
        type: SW_EVENTS.CLEAR_TRACK,
        id: track.id,
      });
      setTimeout(cleanup, 3000);
      remove(track.id);
      await removeTrackFromCache(track.id);
      await removeFromRecent(track.id);
      setRecentMetas((previous) => {
        const next = new Map(previous);
        next.delete(track.id);
        return next;
      });
    },
    [remove, setRecentMetas]
  );
  return {
    startDownload,
    pause,
    resume,
    retry,
    cancel,
    clearFromDownloads,
    removeFromLibrary,
  };
}
