'use client';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SettingsLink() {
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') ?? 'ar';

  return (
    <Link
      href={`/${locale}/settings`}
      className="ms-auto flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-accent"
      aria-label="Settings"
    >
      <Settings className="size-4" />
    </Link>
  );
}
