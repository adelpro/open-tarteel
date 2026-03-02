'use client';

import { Clock } from 'lucide-react';

import { LibraryTrackItem } from '@/components/library/library-track-item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Track } from '@/types';

import { LibraryTabEmptyState } from '../tab-empty-state';

interface RecentTracksProps {
  tracks: Track[];
  onPlay?: (track: Track) => void;
  onRemove?: (track: Track) => void;
}

export function RecentTracks({
  tracks,
  onPlay,
  onRemove,
}: Readonly<RecentTracksProps>) {
  const recentTracks = tracks
    .filter((t) => t.status === 'done')
    // .sort(
    //   (a, b) =>
    //     new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime()
    // )
    .slice(0, 5);

  if (!recentTracks.length) return <LibraryTabEmptyState />;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        <Clock className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          Recently Played
        </h3>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {recentTracks.length}
        </span>
      </div>
      <ScrollArea className="max-h-[260px]">
        <div className="flex flex-col gap-2">
          {recentTracks.map((track) => (
            <LibraryTrackItem
              key={track.id}
              track={track}
              onPlay={onPlay}
              onRemove={onRemove}
            />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}
