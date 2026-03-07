'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  const toggleLocale = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  return (
    <button
      onClick={toggleLocale}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-gray-200 text-sm font-semibold text-gray-900 transition-all duration-200 hover:scale-105 hover:bg-gray-400/70 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 dark:border-gray-600 dark:bg-gray-600/60 dark:text-gray-100 dark:hover:bg-gray-600/80"
      aria-label="Switch language"
    >
      {locale === 'ar' ? 'EN' : 'AR'}
    </button>
  );
}
