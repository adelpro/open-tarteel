import { useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useRecitersFilter } from '@/hooks/reciters/use-reciters-filters';
import { focusedIndexAtom } from '@/jotai/atoms';

export default function SearchInput() {
  const { formatMessage } = useIntl();
  const { searchTerm, setSearchTerm } = useRecitersFilter();
  const setFocusedIndex = useSetAtom(focusedIndexAtom);

  const searchPlaceHolder = formatMessage(t('searchPlaceHolder'));

  const handleSearchTerm = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setFocusedIndex(null);
    },
    [setSearchTerm, setFocusedIndex]
  );
  return (
    <input
      id="search-input"
      type="text"
      placeholder={searchPlaceHolder}
      value={searchTerm}
      onChange={handleSearchTerm}
      className="w-full rounded-full border border-gray-300 p-3 pr-24 text-black shadow-sm focus:border-brand-CTA-blue-500 focus:outline-none dark:text-white"
    />
  );
}
