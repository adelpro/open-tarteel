'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import Container from '@/components/container';
import ReciterPlaylistContent from '@/components/reciter-playlist';
import SimpleSkeleton from '@/components/simple-skeleton';
import { useSyncReciter } from '@/hooks/recent-reciters';
import { useActiveReciter } from '@/hooks/use-active-reciter';
import { useFullscreenEscape } from '@/hooks/use-fullscreen-escape';
import type { Reciter } from '@/types';
import { cn } from '@/utils';

import ReciterSelectorSkeleton from '../reciter-selector/reciter-selector-skeleton';

const ReciterSelector = dynamic(() => import('../reciter-selector'), {
  ssr: false,
  loading: () => <ReciterSelectorSkeleton />,
});

type Props = {
  readonly reciter?: Reciter | null;
};

function ReciterContent({ reciter: r }: Props) {
  const { reciter } = useActiveReciter();

  const [isFullscreen] = useFullscreenEscape();
  useSyncReciter(r);

  if (isFullscreen)
    return (
      <p className="mb-5 flex items-center justify-center gap-2 text-4xl font-bold text-gray-500">
        {reciter?.name || '....'}
      </p>
    );

  return (
    <Container className={cn('flex flex-col')}>
      <ReciterSelector reciter={reciter} />
      <ReciterPlaylistContent />
    </Container>
  );
}

export default function ReciterPage({ reciter }: Props) {
  return (
    <Suspense fallback={<SimpleSkeleton />}>
      <ReciterContent reciter={reciter} />
    </Suspense>
  );
}
