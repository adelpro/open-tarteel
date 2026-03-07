'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  const toggleLocale = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  return (
    <div className="fixed right-4 top-4 z-50">
      <button
        onClick={toggleLocale}
        className="rounded-full bg-gray-900 px-4 py-2 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Switch language"
      >
        {locale === 'ar' ? 'EN' : 'AR'}
      </button>
    </div>
  );
}
