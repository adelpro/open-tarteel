'use client';

import { useAtomValue } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import UnderConstruction from '@/components/under-construction';
import { selectedReciterAtom } from '@/jotai/atom';

import Logo from './logo';

export default function Home() {
  const selectedReciter = useAtomValue(selectedReciterAtom);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!selectedReciter) return;

    const currentPath = `${pathname}?${searchParams.toString()}`;
    const targetPath = `/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`;

    if (currentPath !== targetPath) {
      router.push(targetPath);
    }
  }, [selectedReciter, pathname, searchParams, router]);

  return (
    <div className="w-full flex-col items-center justify-center text-foreground">
      <Logo />
      <UnderConstruction />
    </div>
  );
}
