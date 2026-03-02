import { useAtomValue } from 'jotai';
import { Library } from 'lucide-react';
import { useIntl } from 'react-intl';

import { getMessageConfig } from '@/helpers';
import {
  librarySearchQueryAtom,
  libraryTabAtom,
} from '@/jotai/library-atoms/library-filters';
import { MessageKey } from '@/types';
import { LibraryTab } from '@/types/tracks/tab-type';

export function LibraryTabEmptyState() {
  const tab = useAtomValue(libraryTabAtom);
  const search = useAtomValue(librarySearchQueryAtom);
  const { formatMessage } = useIntl();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
      <Library className="size-20 opacity-30" />
      <p className="text-sm">
        {formatMessage(getEmptyMessage(tab, search), {
          search,
        })}
      </p>
    </div>
  );
}
const getEmptyMessage = (tab: LibraryTab, search: string) => {
  if (search.trim()) return getMessageConfig('library.empty.recent');
  let id: MessageKey;
  switch (tab) {
    case 'recent':
      id = 'library.empty.recent';
      break;
    case 'bookmarks':
      id = 'library.empty.bookmarks';
      break;
    case 'downloads':
      id = 'library.empty.downloads';
      break;
    default:
      id = 'library.empty.all';
      break;
  }
  return getMessageConfig(id);
};
