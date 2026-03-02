import { useAtom } from 'jotai';
import { Bookmark, Clock, Download, ListMusic } from 'lucide-react';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import LibraryTracksList from '@/components/library/library-tracks-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DOWNLOAD_STATUS, LIBRARY_TABS } from '@/constants';
import { getMessageConfig as t } from '@/helpers';
import { useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useLibraryData } from '@/hooks/library/use-library';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';
import useDirection from '@/hooks/use-direction';
import { libraryTabAtom } from '@/jotai/library-atoms/library-filters';

export default function LibraryTabs() {
  const { recentTrackIds } = useRecentTracksData();
  const { bookmarks } = useBookmarksData();
  const { formatMessage } = useIntl();

  const { tracks } = useLibraryData();
  const { dir } = useDirection();

  const [tab, setTab] = useAtom(libraryTabAtom);

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
    }),
    [tracks, recentTrackIds, bookmarks]
  );

  const handleTabChange = (value: string) => {
    if (
      value === LIBRARY_TABS.ALL ||
      value === LIBRARY_TABS.RECENT ||
      value === LIBRARY_TABS.BOOKMARKS ||
      value === LIBRARY_TABS.DOWNLOADS
    ) {
      setTab(value);
    }
  };

  return (
    <Tabs
      // FIXME:
      dir={dir}
      value={tab}
      onValueChange={handleTabChange}
      defaultValue={LIBRARY_TABS.ALL}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList className="w-full shrink-0">
        <TabsTrigger value={LIBRARY_TABS.ALL} className="flex-1 gap-1.5">
          <ListMusic className="size-3.5" />
          <span className="sr-only sm:not-sr-only">
            {formatMessage(t('library.tabs.allWithCount'), {
              count: stats.total,
            })}
          </span>
        </TabsTrigger>
        <TabsTrigger value={LIBRARY_TABS.RECENT} className="flex-1 gap-1.5">
          <Clock className="size-3.5" />
          <span className="sr-only sm:not-sr-only">
            {formatMessage(t('library.tabs.recentWithCount'), {
              count: stats.recent,
            })}
          </span>
        </TabsTrigger>
        <TabsTrigger value={LIBRARY_TABS.BOOKMARKS} className="flex-1 gap-1.5">
          <Bookmark className="size-3.5" />
          <span className="sr-only sm:not-sr-only">
            {formatMessage(t('library.tabs.bookmarkedWithCount'), {
              count: stats.bookmarked,
            })}
          </span>
        </TabsTrigger>
        <TabsTrigger value={LIBRARY_TABS.DOWNLOADS} className="flex-1 gap-1.5">
          <Download className="size-3.5" />
          <span className="sr-only sm:not-sr-only">
            {formatMessage(t('library.tabs.downloadedWithCount'), {
              count: stats.downloaded,
            })}
          </span>
        </TabsTrigger>
      </TabsList>

      {[
        LIBRARY_TABS.ALL,
        LIBRARY_TABS.RECENT,
        LIBRARY_TABS.BOOKMARKS,
        LIBRARY_TABS.DOWNLOADS,
      ].map((tabValue) => (
        <TabsContent
          key={tabValue}
          value={tabValue}
          className="mt-0 min-h-0 flex-1 overflow-hidden"
        >
          <LibraryTracksList />
        </TabsContent>
      ))}
    </Tabs>
  );
}
