import { useEffect, useMemo } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useRecitersData } from '@/hooks/reciters';
import { generateFavId } from '@/utils';

export default function FavoritesFilter() {
  const { reciters } = useRecitersData();
  const { formatMessage } = useIntl();
  const {
    favoriteReciters, //
    showOnlyFavorites,
    setShowOnlyFavorites,
  } = useFavorites();

  const favoriteRecitersList = useMemo(
    () => reciters.filter((r) => favoriteReciters.includes(generateFavId(r))),
    [reciters, favoriteReciters]
  );

  useEffect(() => {
    if (favoriteRecitersList?.length === 0) {
      setShowOnlyFavorites(false);
    }
  }, [favoriteRecitersList, setShowOnlyFavorites]);

  const showAll = formatMessage(t('showAll'));
  const showFavorite = formatMessage(t('showAll'));

  if (!favoriteRecitersList?.length) return;

  return (
    <button
      aria-label={showOnlyFavorites ? showAll : showFavorite}
      title={showOnlyFavorites ? showAll : showFavorite}
      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
      className="rounded-lg p-2.5 transition-all duration-200 hover:bg-yellow-50 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400"
      tabIndex={0}
    >
      {showOnlyFavorites ? (
        <BsStarFill className="size-5 text-yellow-500" />
      ) : (
        <BsStar className="size-5 text-gray-400" />
      )}
    </button>
  );
}
