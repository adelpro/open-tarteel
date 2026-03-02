'use client';

import dynamic from 'next/dynamic';

import { LibraryLoading } from './library-loading';

const LibraryPageContent = dynamic(() => import('./library-page-content'), {
  ssr: false,
  loading: () => <LibraryLoading />,
});
export default function LibraryPageWarper() {
  return <LibraryPageContent />;
}
