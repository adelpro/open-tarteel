import { useAtom } from 'jotai';
import { useMemo } from 'react';

import {
  playlistExpandedAtom,
  playlistFilterAtom,
  playlistSearchAtom,
} from '@/jotai';
import { fuzzySearch, getSurahInfo } from '@/utils';

import { useActiveReciter } from '../use-active-reciter';

export function usePlaylistFilter() {
  const { playlist } = useActiveReciter();
  const [searchQuery, setSearchQuery] = useAtom(playlistSearchAtom);
  const [revelationType, setRevelationType] = useAtom(playlistFilterAtom);
  const [isExpanded, setIsExpanded] = useAtom(playlistExpandedAtom);

  const enrichedPlaylist = useMemo(() => {
    if (!playlist) return [];

    return playlist.map((item) => {
      const surah = getSurahInfo(item.surahId);

      return {
        ...item,
        name: surah?.name || '',
        englishName: surah?.englishName || '',
        surahNumber: surah?.id || 0,
        isMeccan: surah?.revelationType === 'Meccan',
        surah,
      };
    });
  }, [playlist]);

  const filteredPlaylist = useMemo(() => {
    let result = enrichedPlaylist;

    // Filter by revelation type
    if (revelationType === 'meccan') {
      result = result.filter((item) => item.isMeccan);
    } else if (revelationType === 'medinan') {
      result = result.filter((item) => !item.isMeccan);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      const queryLower = query.toLowerCase();
      const isNumber = /^\d+$/.test(query);

      if (isNumber) {
        result = result.filter((item) => item.surahNumber.toString() === query);
      } else {
        const arabicMatches = fuzzySearch(result, query);

        const englishMatches = result.filter((item) =>
          item.englishName.toLowerCase().includes(queryLower)
        );

        const matchedIds = new Set([
          ...arabicMatches.map((m) => m.surahId),
          ...englishMatches.map((m) => m.surahId),
        ]);

        result = result.filter((item) => matchedIds.has(item.surahId));
      }
    }

    return result;
  }, [enrichedPlaylist, searchQuery, revelationType]);

  return {
    isExpanded,
    setIsExpanded,

    searchQuery,
    setSearchQuery,

    revelationType,
    setRevelationType,

    filteredPlaylist,
    totalCount: enrichedPlaylist.length,
  };
}
