'use client';

import { useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';

import { DOWNLOAD_STATUS } from '@/constants';
import { getMessageConfig } from '@/helpers';
import { useBookmarks, useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useLibraryData } from '@/hooks/library/use-library';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';
import { usePlayer } from '@/hooks/player/use-player';
import { useRecitersData } from '@/hooks/reciters';
import { removeLibraryTrackAtom, upsertLibraryTrackAtom } from '@/jotai';
import { removeTrackFromCache, upsertTrackInCache } from '@/lib/tracks/storage';
import type { ButtonConfig } from '@/types';
import { cn, toLibraryTrack } from '@/utils';

import ControlButton from '../control-button';

export default function BookmarkButton() {
  const { track, duration, playlist, trackIndex } = usePlayer();

  const { tracks } = useLibraryData();
  const { reciters } = useRecitersData();

  const { isBookmarked } = useBookmarksData();
  const { unBookmark, bookmark } = useBookmarks();
  const { isRecentlyPlayed } = useRecentTracksData();

  const upsertLibrary = useSetAtom(upsertLibraryTrackAtom);
  const removeLibrary = useSetAtom(removeLibraryTrackAtom);

  const reciter = useMemo(
    () => reciters.find((r) => String(r.id) === track?.reciterId),
    [reciters, track?.reciterId]
  );

  const playlistItem = useMemo(
    () => (typeof trackIndex === 'number' ? playlist[trackIndex] : undefined),
    [playlist, trackIndex]
  );

  const trackId = track?.id ?? null;

  const bookmarked = useMemo(
    () => (trackId ? isBookmarked(trackId) : false),
    [trackId, isBookmarked]
  );

  const getLibraryTrack = useCallback(() => {
    return toLibraryTrack({
      reciter,
      playlistItem,
      duration,
    });
  }, [playlistItem, duration, reciter]);

  const handleToggle = useCallback(async () => {
    if (!trackId) return;

    if (bookmarked) {
      // ── Remove bookmark ───────────────────────────────────────────────────
      await unBookmark(trackId);

      // Remove from library ONLY if track has no other reason to stay:
      // - not recently played
      // - not downloaded
      const LibraryItem = tracks.find((index) => index.id === trackId);
      const isRecent = isRecentlyPlayed(trackId);
      const isDownloaded = LibraryItem?.status === DOWNLOAD_STATUS.DONE;

      if (!isRecent && !isDownloaded) {
        removeLibrary(trackId);
        await removeTrackFromCache(trackId);
      }
    } else {
      // ── Add bookmark ──────────────────────────────────────────────────────
      await bookmark(trackId);

      const track = getLibraryTrack();
      if (track) {
        upsertLibrary(track);
        await upsertTrackInCache(track);
      }
    }
  }, [
    tracks,
    getLibraryTrack,
    trackId,
    bookmarked,
    unBookmark,
    bookmark,
    isRecentlyPlayed,
    upsertLibrary,
    removeLibrary,
  ]);

  const onClick = useCallback(() => {
    handleToggle();
  }, [handleToggle]);

  const config: ButtonConfig = {
    ...getMessageConfig(bookmarked ? 'bookmark.remove' : 'bookmark.add'),
    src: '',
    icon: bookmarked ? BsBookmarkFill : BsBookmark,
    onClick,
    disabled: !trackId,
    extraClass: cn('size-6 text-player-stroke', {
      'text-brand-CTA-blue-500': bookmarked,
      'opacity-50 ': !trackId,
    }),
  };

  return <ControlButton {...config} />;
}
