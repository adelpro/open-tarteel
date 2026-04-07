'use client';

import Link from 'next/link';
import { IoSettingsOutline } from 'react-icons/io5';

export default function SettingsLink() {
  return (
    <Link
      href="/settings"
      className="fixed top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-brand-CTA-blue-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
      style={{ left: '1rem', right: 'auto' }}
      aria-label="Settings"
    >
      <IoSettingsOutline className="size-5" />
    </Link>
  );
}
