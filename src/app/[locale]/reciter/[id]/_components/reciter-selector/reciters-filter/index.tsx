'use client';

import FavoritesFilter from './favorites-filter';
import RecentFilter from './recent-filter';
import RecitersSortByType from './reciters-sort-type';
import SearchInput from './search-input';

export default function RecitersFilterList() {
  return (
    <div className="relative flex w-full">
      <SearchInput />
      <div className="absolute inset-y-0 end-2 flex items-center gap-1 pr-2">
        <RecentFilter />
        <RecitersSortByType />
        <FavoritesFilter />
      </div>
    </div>
  );
}
