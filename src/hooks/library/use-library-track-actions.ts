'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { DOWNLOAD_STATUS, SW_EVENTS } from '@/constants';
import { getMessageConfig as t, getSW, openChannel } from '@/helpers';
import { useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useDownloadManager } from '@/hooks/library/use-download-manager';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';
import {
  bookmarkedTracksAtom,
  libraryTracksAtom,
  recentTracksMetaAtom,
  removeLibraryTrackAtom,
  upsertLibraryTrackAtom,
} from '@/jotai/library-atoms';
import {
  clearAllBookmarks as clearAllBookmarksFromStorage,
  clearAllRecent,
  removeBookmark as removeBookmarkFromStorage,
  removeFromRecent,
  removeTrackFromCache,
  upsertTrackInCache,
} from '@/lib/tracks/storage';
import type { Track } from '@/types';

// ── Callback shape used by every action ──────────────────────────────────────

export interface ActionCallbacks {
  onSuccess?: () => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}

// ── Reusable confirm helper type ─────────────────────────────────────────────

type ConfirmAndRun = (
  message: string,
  action: () => Promise<void>,
  callbacks?: ActionCallbacks
) => Promise<void>;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLibraryTrackActions() {
  const { formatMessage } = useIntl();
  const dl = useDownloadManager();

  const libraryTracks = useAtomValue(libraryTracksAtom);
  const upsertLibrary = useSetAtom(upsertLibraryTrackAtom);
  const removeLibrary = useSetAtom(removeLibraryTrackAtom);
  const setLibraryTracks = useSetAtom(libraryTracksAtom);
  const setRecentMetas = useSetAtom(recentTracksMetaAtom);
  const setBookmarks = useSetAtom(bookmarkedTracksAtom);
  const { isBookmarked } = useBookmarksData();
  const { isRecentlyPlayed } = useRecentTracksData();

  // ── Core confirm helper ───────────────────────────────────────────────────
  // Shows window.confirm, runs action if confirmed, calls onSuccess or onError.
  // Reused by every confirm* method — single place to swap for a modal later.

  const confirmAndRun: ConfirmAndRun = useCallback(
    async (message, action, callbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      const confirmed = globalThis.window.confirm(message);
      if (!confirmed) return;
      try {
        await action();
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    []
  );

  // ── SW helper ─────────────────────────────────────────────────────────────

  const clearAudioInSW = useCallback(async (trackId: string) => {
    const sw = await getSW();
    if (sw) openChannel(sw, { type: SW_EVENTS.CLEAR_TRACK, id: trackId });
  }, []);

  // ── Guard helper ──────────────────────────────────────────────────────────
  // Returns true if track should also be removed from library.
  // Used by removeRecent and removeBookmark.

  const shouldRemoveFromLibrary = useCallback(
    (trackId: Track['id'], skipFlag: 'recent' | 'bookmark') => {
      const track = libraryTracks.find((t) => t.id === trackId);
      if (!track) return false;
      const downloaded = track.status === DOWNLOAD_STATUS.DONE;
      const recent = skipFlag === 'recent' ? false : isRecentlyPlayed(trackId);
      const bookmarked =
        skipFlag === 'bookmark' ? false : isBookmarked(trackId);
      return !downloaded && !recent && !bookmarked;
    },
    [libraryTracks, isRecentlyPlayed, isBookmarked]
  );

  // ── State helpers ─────────────────────────────────────────────────────────

  const isInLibrary = useCallback(
    (trackId: Track['id']) => libraryTracks.some((tr) => tr.id === trackId),
    [libraryTracks]
  );

  const isDownloaded = useCallback(
    (trackId: Track['id']) =>
      libraryTracks.find((tr) => tr.id === trackId)?.status ===
      DOWNLOAD_STATUS.DONE,
    [libraryTracks]
  );

  // ── Track label helper ────────────────────────────────────────────────────

  const trackLabel = (track: Track) =>
    [track.surahName, track.reciterName].filter(Boolean).join(' — ');

  // ─────────────────────────────────────────────────────────────────────────
  // ADD TO LIBRARY
  // Upsert with status IDLE. Does NOT download audio.
  // ─────────────────────────────────────────────────────────────────────────

  const addToLibrary = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        const entry: Track = {
          ...track,
          addedAt: track.addedAt || Date.now(),
          status: DOWNLOAD_STATUS.IDLE,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
        };
        upsertLibrary(entry);
        await upsertTrackInCache(entry);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [upsertLibrary]
  );

  const confirmAddToLibrary = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.add.confirm'), { track: trackLabel(track) }),
        () => addToLibrary(track),
        callbacks
      ),
    [confirmAndRun, addToLibrary, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // START DOWNLOAD
  // ─────────────────────────────────────────────────────────────────────────

  const startDownload = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.startDownload(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmStartDownload = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.download.confirm'), {
          track: trackLabel(track),
        }),
        () => dl.startDownload(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRM DOWNLOAD WITH STATUS (size + estimated time)
  // Lightweight confirm without custom popover UI
  // ─────────────────────────────────────────────────────────────────────────

  const confirmDownloadWithStatus = useCallback(
    async (
      track: Track,
      meta: {
        totalSize?: number;
        remainingBytes?: number;
        estimatedSeconds?: number;
      },
      callbacks?: ActionCallbacks
    ) => {
      const sizeMB = meta.totalSize
        ? (meta.totalSize / 1024 / 1024).toFixed(1)
        : null;

      const remainingMB = meta.remainingBytes
        ? (meta.remainingBytes / 1024 / 1024).toFixed(1)
        : null;

      const timeMin = meta.estimatedSeconds
        ? Math.ceil(meta.estimatedSeconds / 60)
        : null;

      const messageLines = [
        `Download: ${trackLabel(track)}`,
        sizeMB && `Total size: ${sizeMB} MB`,
        remainingMB && `Remaining: ${remainingMB} MB`,
        timeMin && `Estimated time: ~${timeMin} min`,
      ].filter(Boolean);

      const message = messageLines.join('\n');

      return confirmAndRun(message, () => startDownload(track), callbacks);
    },
    [confirmAndRun, startDownload]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAUSE
  // ─────────────────────────────────────────────────────────────────────────

  const pause = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.pause(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmPause = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.pause.confirm'), { track: trackLabel(track) }),
        () => dl.pause(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RESUME
  // ─────────────────────────────────────────────────────────────────────────

  const resume = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.resume(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmResume = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.resume.confirm'), {
          track: trackLabel(track),
        }),
        () => dl.resume(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RETRY
  // ─────────────────────────────────────────────────────────────────────────

  const retry = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.retry(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmRetry = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.retry.confirm'), { track: trackLabel(track) }),
        () => dl.retry(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CANCEL
  // ─────────────────────────────────────────────────────────────────────────

  const cancel = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.cancel(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmCancel = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.cancel.confirm'), {
          track: trackLabel(track),
        }),
        () => dl.cancel(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAR FROM DOWNLOADS
  // Audio bytes deleted. Track stays in library as IDLE.
  // Recent + bookmark flags untouched.
  // ─────────────────────────────────────────────────────────────────────────

  const clearFromDownloads = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        await dl.clearFromDownloads(track);
        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [dl]
  );

  const confirmClearFromDownloads = useCallback(
    (track: Track, callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.clearOffline.confirm'), {
          track: trackLabel(track),
        }),
        () => dl.clearFromDownloads(track),
        callbacks
      ),
    [confirmAndRun, dl, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // REMOVE FROM LIBRARY — nuclear
  // Clears: SW audio + library atom + cache + recent flag + bookmark flag.
  // Consequence message lists what will be deleted based on track state.
  // ─────────────────────────────────────────────────────────────────────────

  const removeFromLibrary = useCallback(
    async (track: Track, callbacks: ActionCallbacks = {}) => {
      const { onSuccess, onError } = callbacks;
      try {
        const sw = await getSW();
        if (sw) openChannel(sw, { type: SW_EVENTS.CLEAR_TRACK, id: track.id });

        removeLibrary(track.id);
        await removeTrackFromCache(track.id);

        await removeFromRecent(track.id);
        setRecentMetas((previous) => {
          const next = new Map(previous);
          next.delete(track.id);
          return next;
        });

        setBookmarks((previous) => {
          const next = new Map(previous);
          next.delete(track.id);
          return next;
        });

        if (onSuccess) await onSuccess();
      } catch (error) {
        if (onError) await onError(error);
        else throw error;
      }
    },
    [removeLibrary, setRecentMetas, setBookmarks]
  );

  const confirmRemoveFromLibrary = useCallback(
    (track: Track, callbacks?: ActionCallbacks) => {
      const downloaded = track.status === DOWNLOAD_STATUS.DONE;
      const bookmarked = isBookmarked(track.id);
      const label = trackLabel(track);

      const consequences: string[] = [];
      if (downloaded)
        consequences.push(
          formatMessage(t('library.remove.consequence.offline'))
        );
      if (bookmarked)
        consequences.push(
          formatMessage(t('library.remove.consequence.bookmark'))
        );

      const message =
        consequences.length > 0
          ? formatMessage(t('library.remove.confirmWithConsequences'), {
              track: label,
              consequences: consequences.join(', '),
            })
          : formatMessage(t('library.remove.confirm'), { track: label });

      return confirmAndRun(message, () => removeFromLibrary(track), callbacks);
    },
    [confirmAndRun, removeFromLibrary, isBookmarked, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAR ALL DOWNLOADS
  // Remove offline audio from ALL downloaded tracks.
  // ─────────────────────────────────────────────────────────────────────────

  const clearAllDownloads = useCallback(
    async (callbacks: ActionCallbacks = {}) => {
      try {
        const downloaded = libraryTracks.filter(
          (t) => t.status === DOWNLOAD_STATUS.DONE
        );
        for (const track of downloaded) {
          await clearFromDownloads(track);
        }
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [libraryTracks, clearFromDownloads]
  );

  const confirmClearAllDownloads = useCallback(
    (callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.clearAllOffline.confirm')),
        () => clearAllDownloads(),
        callbacks
      ),
    [confirmAndRun, clearAllDownloads, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CLEAR LIBRARY — nuclear
  // ─────────────────────────────────────────────────────────────────────────

  const clearLibrary = useCallback(
    async (callbacks: ActionCallbacks = {}) => {
      try {
        // Tell SW to clear audio for every downloaded track
        for (const track of libraryTracks) {
          await clearAudioInSW(track.id);
          await removeTrackFromCache(track.id);
        }
        // Clear all atoms in one pass
        setLibraryTracks([]);
        setRecentMetas(new Map());
        setBookmarks(new Map());
        await clearAllRecent();
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [
      libraryTracks,
      clearAudioInSW,
      setLibraryTracks,
      setRecentMetas,
      setBookmarks,
    ]
  );

  const confirmClearLibrary = useCallback(
    (callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.clearAll.confirm')),
        () => clearLibrary(),
        callbacks
      ),
    [confirmAndRun, clearLibrary, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RECENT
  // ─────────────────────────────────────────────────────────────────────────

  /** Remove one track from recent. Remove from library if not bookmarked/downloaded. */
  const removeRecent = useCallback(
    async (trackId: Track['id'], callbacks: ActionCallbacks = {}) => {
      try {
        await removeFromRecent(trackId);
        setRecentMetas((previous) => {
          const n = new Map(previous);
          n.delete(trackId);
          return n;
        });

        if (shouldRemoveFromLibrary(trackId, 'recent')) {
          removeLibrary(trackId);
          await removeTrackFromCache(trackId);
        }
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [setRecentMetas, removeLibrary, shouldRemoveFromLibrary]
  );

  const confirmRemoveRecent = useCallback(
    (trackId: Track['id'], callbacks?: ActionCallbacks) => {
      const track = libraryTracks.find((t) => t.id === trackId);
      const willRemove = shouldRemoveFromLibrary(trackId, 'recent');
      const label = [track?.surahName, track?.reciterName]
        .filter(Boolean)
        .join(' — ');

      const message = formatMessage(
        t(
          willRemove
            ? 'settings.recent.confirmRemoveWithLibrary'
            : 'settings.recent.confirmRemoveOnlyRecent'
        ),
        { track: label }
      );

      return confirmAndRun(message, () => removeRecent(trackId), callbacks);
    },
    [
      confirmAndRun,
      removeRecent,
      libraryTracks,
      shouldRemoveFromLibrary,
      formatMessage,
    ]
  );

  /** Clear all recent. Remove from library tracks that were only recent. */
  const clearAllRecentTracks = useCallback(
    async (callbacks: ActionCallbacks = {}) => {
      try {
        const toRemove: Track['id'][] = [];

        setRecentMetas((previous) => {
          for (const trackId of previous.keys()) {
            if (shouldRemoveFromLibrary(trackId, 'recent'))
              toRemove.push(trackId);
          }
          return new Map();
        });

        await clearAllRecent();

        for (const id of toRemove) {
          removeLibrary(id);
          await removeTrackFromCache(id);
        }
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [setRecentMetas, removeLibrary, shouldRemoveFromLibrary]
  );

  const confirmClearAllRecent = useCallback(
    (callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('settings.recent.confirmClearAll')),
        () => clearAllRecentTracks(),
        callbacks
      ),
    [confirmAndRun, clearAllRecentTracks, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // BOOKMARKS
  // ─────────────────────────────────────────────────────────────────────────

  /** Remove one bookmark. Remove from library if not recent/downloaded. */
  const removeBookmark = useCallback(
    async (trackId: Track['id'], callbacks: ActionCallbacks = {}) => {
      try {
        await removeBookmarkFromStorage(trackId);

        setBookmarks((previous) => {
          const next = new Map(previous);
          next.delete(trackId);
          return next;
        });

        if (shouldRemoveFromLibrary(trackId, 'bookmark')) {
          removeLibrary(trackId);
          await removeTrackFromCache(trackId);
        }
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [setBookmarks, removeLibrary, shouldRemoveFromLibrary]
  );

  const confirmRemoveBookmark = useCallback(
    (trackId: Track['id'], callbacks?: ActionCallbacks) => {
      const track = libraryTracks.find((t) => t.id === trackId);
      const willRemove = shouldRemoveFromLibrary(trackId, 'bookmark');
      const label = [track?.surahName, track?.reciterName]
        .filter(Boolean)
        .join(' — ');

      const message = formatMessage(
        t(
          willRemove
            ? 'library.bookmark.confirmRemoveWithLibrary'
            : 'library.bookmark.confirmRemoveOnly'
        ),
        { track: label }
      );

      return confirmAndRun(message, () => removeBookmark(trackId), callbacks);
    },
    [
      confirmAndRun,
      removeBookmark,
      libraryTracks,
      shouldRemoveFromLibrary,
      formatMessage,
    ]
  );

  /** Clear all bookmarks. Remove from library tracks that were only bookmarked. */
  const clearAllBookmarks = useCallback(
    async (callbacks: ActionCallbacks = {}) => {
      try {
        const toRemove: Track['id'][] = [];

        setBookmarks((previous) => {
          for (const trackId of previous.keys()) {
            if (shouldRemoveFromLibrary(trackId, 'bookmark'))
              toRemove.push(trackId);
          }
          return new Map();
        });

        await clearAllBookmarksFromStorage();

        for (const id of toRemove) {
          removeLibrary(id);
          await removeTrackFromCache(id);
        }
        if (callbacks.onSuccess) await callbacks.onSuccess();
      } catch (error) {
        if (callbacks.onError) await callbacks.onError(error);
        else throw error;
      }
    },
    [setBookmarks, removeLibrary, shouldRemoveFromLibrary]
  );

  const confirmClearAllBookmarks = useCallback(
    (callbacks?: ActionCallbacks) =>
      confirmAndRun(
        formatMessage(t('library.bookmark.confirmClearAll')),
        () => clearAllBookmarks(),
        callbacks
      ),
    [confirmAndRun, clearAllBookmarks, formatMessage]
  );

  // ─────────────────────────────────────────────────────────────────────────

  return {
    // State helpers
    isInLibrary,
    isDownloaded,

    // Raw actions (no dialog) — each accepts optional { onSuccess, onError }
    addToLibrary,
    startDownload,
    pause,
    resume,
    retry,
    cancel,
    clearFromDownloads,
    removeFromLibrary,
    clearAllDownloads,
    clearLibrary,
    removeRecent,
    clearAllRecentTracks,
    removeBookmark,
    clearAllBookmarks,

    // Confirmed actions — dialog first, then same callbacks
    confirmAddToLibrary,
    confirmStartDownload,
    confirmDownloadWithStatus,
    confirmPause,
    confirmResume,
    confirmRetry,
    confirmCancel,
    confirmClearFromDownloads,
    confirmRemoveFromLibrary,
    confirmClearAllDownloads,
    confirmClearLibrary,
    confirmRemoveRecent,
    confirmClearAllRecent,
    confirmRemoveBookmark,
    confirmClearAllBookmarks,
  };
}
