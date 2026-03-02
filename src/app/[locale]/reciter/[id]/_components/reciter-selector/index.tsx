'use client';

import { atom, useAtom } from 'jotai';
import { useIntl } from 'react-intl';

import Dialog from '@/components/dialog';
import { getMessageConfig as t } from '@/helpers';
import { Reciter } from '@/types';
import { cn } from '@/utils';

import FavoritesHeader from './favorites-header';
import RecitersFilterList from './reciters-filter';
import RecitersList from './reciters-list';
import RiwayatFilter from './riwaya-filter';
import SearchIcon from './search-icon';
import ShareReciter from './share-reciter';
import ToggleFavoriteReciter from './toggle-favorite-reciter';

export const isRecitersListOpenAtom = atom<boolean>(false);
export default function ReciterSelector({
  reciter,
}: {
  readonly reciter?: Reciter | null;
}) {
  const [isOpen, setIsOpen] = useAtom(isRecitersListOpenAtom);

  const { formatMessage } = useIntl();
  const fallback = formatMessage(t('reciter.select'));

  const reciterName = reciter?.name ?? fallback;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex w-full max-w-lg items-center justify-between gap-3 rounded-xl p-3 transition-all duration-200 active:scale-95',

          // use theme tokens only
          'bg-background text-foreground shadow-md',

          'hover:bg-accent hover:text-accent-foreground',

          'focus:outline-none focus:ring-4 focus:ring-ring'
        )}
        aria-label={fallback}
      >
        <span className="max-w-[200px] truncate font-semibold">
          {reciterName}
        </span>
        <ShareReciter reciter={reciter} asChild />
        <ToggleFavoriteReciter reciter={reciter} asChild />
        <SearchIcon />
      </button>
      <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
        <section className="mx-auto flex w-full flex-col gap-4 px-1">
          <RecitersFilterList />
          <RiwayatFilter />
          <FavoritesHeader />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <RecitersList />
          </div>
        </section>
      </Dialog>
    </>
  );
}
