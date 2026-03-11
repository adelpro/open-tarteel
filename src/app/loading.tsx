'use client';

import Skeleton from 'react-loading-skeleton';

export default function Loading() {
  return (
    <div className="flex min-h-full w-full justify-center px-4">
      <div className="flex w-full max-w-2xl flex-col items-center gap-y-6 text-foreground">
        <section className="flex flex-col items-center justify-center p-2 text-center md:p-4">
          <div>
            <Skeleton circle width={150} height={150} />
          </div>

          <div className="mb-4 w-full max-w-md">
            <Skeleton height={40} />
          </div>

          <div className="w-full max-w-md">
            <Skeleton count={2} />
          </div>
        </section>

        <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl p-3">
          <span className="w-full">
            <Skeleton className="h-[50px]" />
          </span>
        </div>
      </div>
    </div>
  );
}
