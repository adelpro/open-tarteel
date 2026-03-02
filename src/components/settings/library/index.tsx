'use client';

import {
  AlertTriangle,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Download,
  History,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { Button } from '@/components/ui/button';
import { DOWNLOAD_STATUS } from '@/constants';
import { getMessageConfig as t } from '@/helpers';
import { useBookmarksData } from '@/hooks/library/use-bookmarks';
import { useLibraryData } from '@/hooks/library/use-library';
import { useLibraryTrackActions } from '@/hooks/library/use-library-track-actions';
import { useRecentTracksData } from '@/hooks/library/use-recent-tracks';
import { cn } from '@/lib/utils';

function CollapsibleSection({
  icon,
  title,
  count,
  accentClass,
  clearLabel,
  emptyLabel,
  onClearAll,
  defaultOpen = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  accentClass: string;
  clearLabel: string;
  emptyLabel: string;
  onClearAll: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 cursor-pointer items-center gap-2.5 text-start"
        >
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              accentClass
            )}
          >
            {icon}
          </span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
          <span className="ms-auto text-muted-foreground">
            {open ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </span>
        </button>

        {count > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearAll}
            className="hover: shrink-0 gap-1.5"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">{clearLabel}</span>
          </Button>
        )}
      </div>

      {open && count > 0 && (
        <div className="border-t border-border">{children}</div>
      )}

      {open && count === 0 && (
        <div className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  title,
  subtitle,
  onRemove,
}: {
  title?: string;
  subtitle?: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <button
        onClick={onRemove}
        className="hover: shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10"
        aria-label={`Remove ${title}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

export function LibrarySettings() {
  const { formatMessage } = useIntl();

  const trackActions = useLibraryTrackActions();
  const { tracks } = useLibraryData();
  const { recentTracks } = useRecentTracksData();
  const { bookmarks } = useBookmarksData();

  const downloadedTracks = tracks.filter(
    (t) => t.status === DOWNLOAD_STATUS.DONE
  );

  // Bookmarked tracks derived from library (single truth)
  const bookmarkedTracks = tracks.filter((t) => bookmarks.has(t.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Danger zone */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <AlertTriangle className="size-4 shrink-0 dark:text-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-semibold dark:text-foreground">
              {formatMessage(t('settings.library.clearAll.title'))}
            </p>
            <p className="text-xs">
              {formatMessage(t('settings.library.clearAll.description'))}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => trackActions.confirmClearLibrary()}
        >
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">
            {formatMessage(t('settings.library.clearAll.button'))}
          </span>
        </Button>
      </div>

      {/* Downloads */}
      <CollapsibleSection
        icon={<Download className="size-4 text-foreground" />}
        title={formatMessage(t('settings.library.downloads'))}
        count={downloadedTracks.length}
        accentClass="bg-secondary"
        clearLabel={formatMessage(t('settings.library.downloads.clearAll'))}
        emptyLabel={formatMessage(t('settings.library.empty'))}
        onClearAll={() => trackActions.confirmClearAllDownloads()}
        defaultOpen
      >
        <div className="divide-y divide-border">
          {downloadedTracks.map((track) => (
            <ItemRow
              key={track.id}
              title={track.surahName}
              subtitle={track.reciterName}
              onRemove={() => trackActions.confirmClearFromDownloads(track)}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Recent */}
      <CollapsibleSection
        icon={<History className="size-4 text-foreground" />}
        title={formatMessage(t('settings.library.recent'))}
        count={recentTracks.length}
        accentClass="bg-secondary"
        clearLabel={formatMessage(t('settings.library.recent.clearAll'))}
        emptyLabel={formatMessage(t('settings.library.empty'))}
        onClearAll={() => trackActions.confirmClearAllRecent()}
        defaultOpen
      >
        <div className="divide-y divide-border">
          {recentTracks.map((track) => (
            <ItemRow
              key={track.id}
              title={track.surahName}
              subtitle={track.reciterName}
              onRemove={() => trackActions.confirmRemoveRecent(track.id)}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Bookmarks */}
      <CollapsibleSection
        icon={<Bookmark className="size-4 text-foreground" />}
        title={formatMessage(t('settings.library.bookmarks'))}
        count={bookmarks.size}
        accentClass="bg-secondary"
        clearLabel={formatMessage(t('settings.library.bookmarks.clearAll'))}
        emptyLabel={formatMessage(t('settings.library.empty'))}
        onClearAll={() => trackActions.confirmClearAllBookmarks()}
      >
        <div className="divide-y divide-border">
          {bookmarkedTracks.map((track) => (
            <ItemRow
              key={track.id}
              title={track.surahName}
              subtitle={track.reciterName}
              onRemove={() => trackActions.confirmRemoveBookmark(track.id)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
