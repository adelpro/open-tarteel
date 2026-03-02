'use client';

import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';

import { fullscreenAtom } from '@/jotai';

import { FooterSkeleton } from './FooterSkeleton';

export const FooterNav = dynamic(() => import('./footer-nav'), {
  ssr: false,
  loading: () => <FooterSkeleton />,
});

export default function Footer() {
  const isFullscreen = useAtomValue(fullscreenAtom);

  if (isFullscreen) return;

  return (
    <footer className="h-[var(--footer-height)] shrink-0 items-center border-t border-border px-2 sm:px-8">
      <FooterNav />
    </footer>
  );
}
