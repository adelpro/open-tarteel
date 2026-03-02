'use client';

import LibraryHeader from '@/components/library/library-header';
import LibrarySearch from '@/components/library/library-search';
import LibraryStatsBar from '@/components/library/library-stats-bar';
import LibraryTabs from '@/components/library/library-tabs';

export default function LibraryPageContent() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-4">
        <LibraryHeader />
        <LibrarySearch />
        <LibraryStatsBar />
      </div>
      <LibraryTabs />
    </div>
  );
}
