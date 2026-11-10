'use client';

import { useAtom } from 'jotai';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import NetworkStatusIndicator from '@/components/network-status-indicator';
import ReciterSelector from '@/components/reciter-selector';
import { useReciters } from '@/hooks/use-reciters';
import { selectedReciterAtom } from '@/jotai/atom';

import Logo from '../components/hero';

export default function Home() {
  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);
  const { reciters, loading } = useReciters();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Validate selectedReciter exists in reciters list
  useEffect(() => {
    if (!isClient || loading || reciters.length === 0) return;

    if (selectedReciter) {
      const exists = reciters.some((r) => r.id === selectedReciter.id);
      if (!exists) {
        setSelectedReciter(null);
        return;
      }
    }
  }, [isClient, loading, reciters, selectedReciter, setSelectedReciter]);

  // Open the persisted selection immediately. The reciter route can rebuild
  // its playlist locally or fetch it, so the catalog is not a precondition.
  useEffect(() => {
    if (!isClient || !selectedReciter) return;

    const targetPath = `/reciter/${selectedReciter.id}?moshafId=${selectedReciter.moshaf.id}`;
    if (`${pathname}?${searchParams.toString()}` !== targetPath) {
      router.replace(targetPath);
    }
  }, [isClient, selectedReciter, pathname, searchParams, router]);

  if (!isClient) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
        <Logo />
        <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white to-gray-100 p-3 shadow-md">
          <span className="max-w-[200px] truncate font-semibold text-gray-900">
            Select A Reciter
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <Logo />
      <div className="w-full max-w-lg">
        <NetworkStatusIndicator />
      </div>
      <ReciterSelector />
    </div>
  );
}
