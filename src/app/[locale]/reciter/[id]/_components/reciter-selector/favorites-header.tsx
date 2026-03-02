import { useMemo } from 'react';
import { BsStarFill } from 'react-icons/bs';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useRecitersData } from '@/hooks/reciters';
import { generateFavId } from '@/utils';

export default function FavoritesHeader() {
  const { reciters } = useRecitersData();
  const { favoriteReciters, showOnlyFavorites } = useFavorites();
  const { formatMessage } = useIntl();

  const favoriteList = useMemo(
    () => reciters.filter((r) => favoriteReciters.includes(generateFavId(r))),
    [reciters, favoriteReciters]
  );
  if (!showOnlyFavorites) return;

  return (
    <section className="mt-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 dark:text-white">
        <BsStarFill className="h-6 w-6 text-yellow-500" />
        <span>{formatMessage(t('favorites'))}</span> ({favoriteList.length})
      </h2>
    </section>
  );
}
