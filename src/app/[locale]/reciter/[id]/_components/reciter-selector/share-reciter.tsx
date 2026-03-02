'use client';

import { FaRegShareFromSquare } from 'react-icons/fa6';

import { Button } from '@/components/button';
import { ICON_SIZE } from '@/constants';
import { Reciter } from '@/types';
import { cn, useShareReciter } from '@/utils';

export default function ShareReciter({
  reciter,
  asChild,
}: {
  readonly reciter: Reciter | undefined | null;
  readonly asChild?: boolean;
}) {
  const { shareReciter } = useShareReciter();

  const handleShare = async (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
    if (reciter) shareReciter(reciter);
  };

  if (!reciter) return;

  return (
    <Button
      className={cn(
        'ms-auto transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
        {
          'rounded-full p-2': !asChild,
        }
      )}
      onClick={handleShare}
      aria-label="Share reciter"
      asChild={asChild}
    >
      <FaRegShareFromSquare
        size={ICON_SIZE}
        className="cursor-pointer text-gray-600/80 transition-colors hover:text-gray-600"
        tabIndex={asChild ? 0 : undefined}
        onKeyDown={(event) => {
          if (!asChild) return;
          if (event.key === 'Enter' || event.key === ' ') {
            handleShare(event);
          }
        }}
      />
    </Button>
  );
}
