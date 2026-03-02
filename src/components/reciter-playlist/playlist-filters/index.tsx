'use client';

import { Search, X } from 'lucide-react';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { usePlaylistFilter } from '@/hooks/playlist/use-playlist-filter';
import { FilterType } from '@/jotai';
import { cn } from '@/lib/utils';

const filterOptions: Array<{ value: FilterType; id: string }> = [
  { value: 'all', id: 'reciters.filters.type.all' },
  { value: 'meccan', id: 'reciters.filters.type.meccan' },
  { value: 'medinan', id: 'reciters.filters.type.medinan' },
];
export default function PlayListFilters() {
  const { formatMessage } = useIntl();

  const {
    searchQuery,
    setSearchQuery,
    revelationType,
    setRevelationType,
    filteredPlaylist,
    totalCount,
  } = usePlaylistFilter();
  return (
    <div className="space-y-3 border-b border-border bg-secondary/10 px-4 py-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={formatMessage(t('reciters.filters.search.placeholder'))}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full rounded-md border border-border bg-background py-2 pl-9 pr-8 text-sm',
            'placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setRevelationType(option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              revelationType === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
            )}
          >
            {formatMessage(t(option.id))}
          </button>
        ))}
        {(searchQuery || revelationType !== 'all') && (
          <p className="ms-auto flex items-center justify-center text-xs text-muted-foreground">
            {formatMessage(t('reciters.filters.results.count'), {
              current: filteredPlaylist?.length ?? 0,
              total: totalCount,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
