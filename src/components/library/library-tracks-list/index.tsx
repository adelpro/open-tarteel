import { useAtomValue } from 'jotai';
import { useMemo } from 'react';

import { LibraryTrackItem } from '@/components/library/library-track-item';
import { LibraryTabEmptyState } from '@/components/library/tab-empty-state';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DOWNLOAD_STATUS, LIBRARY_TABS } from '@/constants';
import { useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useLibraryData } from '@/hooks/library/use-library';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';
import {
  librarySearchQueryAtom,
  libraryTabAtom,
} from '@/jotai/library-atoms/library-filters';

export default function LibraryTracksList() {
  const { recentTrackIds } = useRecentTracksData();
  const { bookmarks } = useBookmarksData();

  const { tracks: rawTrack } = useLibraryData();

  const tab = useAtomValue(libraryTabAtom);
  const searchQuery = useAtomValue(librarySearchQueryAtom);

  const tracks = useMemo(() => {
    let result = rawTrack;

    // Tab filter
    if (tab === LIBRARY_TABS.RECENT)
      result = result.filter((t) => recentTrackIds.has(t.id));
    if (tab === LIBRARY_TABS.BOOKMARKS)
      result = result.filter((t) => bookmarks.has(t.id));
    if (tab === LIBRARY_TABS.DOWNLOADS)
      result = result.filter((t) => t.status === DOWNLOAD_STATUS.DONE);

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.surahName?.toLowerCase().includes(q) ||
          t.reciterName?.toLowerCase().includes(q) ||
          t.surahNameEn?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rawTrack, tab, searchQuery, recentTrackIds, bookmarks]);

  if (!tracks.length) return <LibraryTabEmptyState />;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 pr-2">
        {tracks.map((track) => (
          <LibraryTrackItem key={track.id} track={track} />
        ))}
      </div>
    </ScrollArea>
  );
}
