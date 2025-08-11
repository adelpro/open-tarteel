'use client';

import { useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import ReciterSelector from '@/components/reciter-selector';
import UnderConstruction from '@/components/under-construction';
import { selectedReciterAtom } from '@/jotai/atom';

import Logo from '../components/logo';

export default function Home() {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !selectedReciter) return;
    const currentPath = `${pathname}?${searchParams.toString()}`;
    const targetPath = `/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`;

    if (currentPath !== targetPath) {
      router.push(targetPath);
    }
  }, [selectedReciter, pathname, searchParams, router, isClient]);

  if (!isClient) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
        <Logo />
        <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white to-gray-100 p-3 shadow-md">
          <span className="max-w-[200px] truncate font-semibold text-gray-900">
            Select A Reciter
          </span>
        </div>
        <UnderConstruction />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <Logo />
      <ReciterSelector />
      <UnderConstruction />
    </div>
  );
}
