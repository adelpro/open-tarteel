import { ImSortAmountDesc } from 'react-icons/im';
import {
  TbSortAscendingLetters,
  TbSortDescendingNumbers,
} from 'react-icons/tb';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useRecitersFilter } from '@/hooks/reciters';
import { RecitersSortType, SORT_TYPE } from '@/types';

export default function RecitersSortByType() {
  const { sortMode, setSortMode } = useRecitersFilter();
  const { formatMessage } = useIntl();

  const sort = t('sort');
  const sortByAlphabet = t('sort.byAlphabet');
  const sortByFavorite = t('sort.byFavorite');
  const sortByViews = t('sort.byViews');

  const SORT_MAP = {
    [sort.id]: sort,
    [sortByAlphabet.id]: sortByAlphabet,
    [sortByFavorite.id]: sortByFavorite,
    [sortByViews.id]: sortByViews,
  };

  const renderSortIcon = (mode: RecitersSortType) => {
    if (mode === SORT_TYPE.ALPHABETICAL)
      return <TbSortAscendingLetters className="size-5" />;
    if (mode === SORT_TYPE.VIEWS)
      return <TbSortDescendingNumbers className="size-5" />;
    return <ImSortAmountDesc className="size-5" />;
  };

  const getSortId = (mode: RecitersSortType) => {
    if (mode === SORT_TYPE.ALPHABETICAL) return sortByAlphabet.id;
    if (mode === SORT_TYPE.VIEWS) return sortByViews.id;
    return sortByFavorite.id;
  };

  const getNextSortMode = (mode: RecitersSortType): RecitersSortType => {
    if (mode === SORT_TYPE.POPULAR) return SORT_TYPE.ALPHABETICAL;
    if (mode === SORT_TYPE.ALPHABETICAL) return SORT_TYPE.VIEWS;
    return SORT_TYPE.POPULAR;
  };

  const title = formatMessage({ ...SORT_MAP[getSortId(sortMode)] });

  return (
    <button
      title={title}
      onClick={() => setSortMode(getNextSortMode)}
      className="hover:bg-brand-CTA-blue-50 dark:hover:bg-brand-CTA-blue-900/30 dark:hover:text-brand-CTA-blue-400 rounded-full p-2.5 text-gray-500 transition-all duration-200 hover:text-brand-CTA-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/50"
      aria-label={title}
    >
      {renderSortIcon(sortMode)}
    </button>
  );
}
