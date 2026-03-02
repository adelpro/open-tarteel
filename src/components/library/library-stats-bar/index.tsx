import { ClockArrowDown, Disc3 } from 'lucide-react';
import { useMemo } from 'react';

import { DOWNLOAD_STATUS } from '@/constants';
import { useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useLibraryData } from '@/hooks/library/use-library';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';

export default function LibraryStatsBar() {
  const { tracks } = useLibraryData();
  const { recentTrackIds } = useRecentTracksData();
  const { bookmarks } = useBookmarksData();

  const stats = useMemo(
    () => ({
      total: tracks.length,
      downloaded: tracks.filter((t) => t.status === DOWNLOAD_STATUS.DONE)
        .length,
      active: tracks.filter(
        (t) =>
          t.status === DOWNLOAD_STATUS.DOWNLOADING ||
          t.status === DOWNLOAD_STATUS.QUEUED
      ).length,
      recent: recentTrackIds.size,
      bookmarked: bookmarks.size,
      queued: tracks.filter((t) => t.status === DOWNLOAD_STATUS.QUEUED).length,
    }),
    [tracks, recentTrackIds, bookmarks]
  );

  return (
    <div className="flex h-3 shrink-0 gap-3 text-xs text-muted-foreground">
      {stats.queued > 0 && (
        <span className="inline-flex items-center gap-1">
          <ClockArrowDown className="text-success size-3" />
          {stats.queued} Queued
        </span>
      )}
      {stats.active > 0 && (
        <span className="inline-flex items-center gap-1">
          <Disc3 className="size-3 animate-spin text-primary" />
          {stats.active} Active
        </span>
      )}
    </div>
  );
}
