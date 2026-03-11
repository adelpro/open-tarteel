'use client';

import Skeleton from 'react-loading-skeleton';

export default function Loading() {
  return (
    <main className="flex min-h-[70vh] w-full items-center justify-center p-4 md:p-8">
      <div className="flex h-full flex-col gap-3">
        <Skeleton className="h-10px" />
        <div className="flex-1">
          <Skeleton />
        </div>
      </div>
    </main>
  );
}
