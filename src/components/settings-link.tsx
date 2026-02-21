'use client';

import { IoSettingsOutline } from 'react-icons/io5';
import Link from 'next/link';

export default function SettingsLink() {
  return (
    <Link
      href="/settings"
      className="fixed left-2 top-2 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
      aria-label="Settings"
    >
      <IoSettingsOutline className="size-5" />
    </Link>
  );
}
