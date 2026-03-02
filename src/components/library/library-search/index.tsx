import { useAtom } from 'jotai';
import { Search } from 'lucide-react';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { librarySearchQueryAtom } from '@/jotai/library-atoms/library-filters';

export default function LibrarySearch() {
  const { formatMessage } = useIntl();
  const [searchQuery, setSearchQuery] = useAtom(librarySearchQueryAtom);
  return (
    <div className="relative shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={formatMessage(t('library.search.placeholder'))}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}
