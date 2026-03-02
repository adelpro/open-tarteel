'use client';

import { useBookmarksSync } from '@/hooks/library/use-bookmarks';
import { useLibraryHydration } from '@/hooks/library/use-library';
import { useRecentTracksSync } from '@/hooks/library/use-recent-tracks';

export default function LibraryTracksSyncs() {
  useLibraryHydration();
  useBookmarksSync();
  useRecentTracksSync();
  return undefined;
}
