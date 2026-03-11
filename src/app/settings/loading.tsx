'use client';

import Skeleton from 'react-loading-skeleton';

export default function SettingsLoading() {
  return (
    <div className="mt-10 flex w-full flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-center text-3xl font-bold">
          <Skeleton />
        </h1>

        <section className="m-1 space-y-4 rounded p-4 text-start md:m-2">
          <Skeleton className="h-[200px] w-full" />
        </section>
      </div>
    </div>
  );
}
