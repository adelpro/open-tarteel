'use client';

import dynamic from 'next/dynamic';

import { LanguageSwitcherSkeleton } from './language-switcher-skeleton';

const LanguageSwitcher = dynamic(
  () => import('@/components/header/language-switcher'),
  {
    ssr: false,
    loading: () => <LanguageSwitcherSkeleton />,
  }
);
export default function Header() {
  return (
    <header>
      <div className="fixed right-2 top-2 z-50 bg-transparent" dir="ltr">
        <LanguageSwitcher />
      </div>
    </header>
    // <header className="h-[var(--header-height)] shrink-0 bg-transparent">
    //   <div className="fixed right-2 top-2 z-50 bg-transparent" dir="ltr">
    //     <LanguageSwitcher />
    //   </div>
    // </header>
  );
}
