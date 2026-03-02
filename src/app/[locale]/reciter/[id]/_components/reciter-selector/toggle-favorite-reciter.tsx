import { BsStar, BsStarFill } from 'react-icons/bs';

import { Button } from '@/components/button';
import { ICON_SIZE } from '@/constants';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { Reciter } from '@/types';
import { cn, generateFavId } from '@/utils';

export default function ToggleFavoriteReciter({
  reciter,
  asChild,
}: {
  readonly reciter: Reciter | undefined | null;
  readonly asChild?: boolean;
}) {
  const { toggleFavorite, favoriteReciters } = useFavorites();
  const favId = reciter ? generateFavId(reciter) : null;
  const isFavorite = favId ? favoriteReciters.includes(favId) : false;

  if (!reciter || !favId) return;

  return (
    <Button
      className={cn(
        'transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
        {
          'rounded-full p-2': !asChild,
        }
      )}
      onClick={(event) => {
        event.stopPropagation();
        toggleFavorite(favId);
      }}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      asChild={asChild}
    >
      {isFavorite ? (
        <BsStarFill
          size={ICON_SIZE}
          className="cursor-pointer text-yellow-300 transition-colors hover:text-yellow-200"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(favId);
          }}
          tabIndex={asChild ? 0 : undefined}
          role={asChild ? 'button' : undefined}
          aria-pressed="true"
          aria-label="Remove from favorites"
        />
      ) : (
        <BsStar
          size={ICON_SIZE}
          className="cursor-pointer text-gray-600/80 transition-colors hover:text-gray-600"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(favId);
          }}
          tabIndex={asChild ? 0 : undefined}
          role={asChild ? 'button' : undefined}
          aria-pressed="false"
          aria-label="Add to favorites"
        />
      )}
    </Button>
  );
}
