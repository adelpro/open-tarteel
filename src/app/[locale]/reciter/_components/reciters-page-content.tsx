'use client';

import dynamic from 'next/dynamic';

import ReciterSelectorSkeleton from '../[id]/_components/reciter-selector/reciter-selector-skeleton';

const ReciterSelector = dynamic(
  () => import('../[id]/_components/reciter-selector'),
  {
    ssr: false,
    loading: () => <ReciterSelectorSkeleton />,
  }
);
export default function RecitersPageContent() {
  return <ReciterSelector />;
}
