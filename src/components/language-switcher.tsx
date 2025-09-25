'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  return (
    <div className="fixed right-2 top-2 z-50" dir="ltr">
      {' '}
      {/* ← changed from right-0 m-2 to right-2 top-2 */}
      <button
        type="button"
        onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
        className="relative flex h-8 w-24 cursor-pointer items-center overflow-hidden rounded-full border border-gray-300 bg-white text-[10px] font-semibold leading-none shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 sm:w-32 sm:text-sm"
        aria-label="Switch language"
      >
        {/* Moving background indicator */}
        <span
          className={`absolute bottom-0 left-0 top-0 w-1/2 rounded-full bg-gray-900 transition-transform duration-200 ease-out ${
            locale === 'ar' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />

        {/* EN */}
        <span
          className={`z-10 flex h-full w-1/2 items-center justify-center transition-colors duration-200 ${
            locale === 'en' ? 'text-white' : 'text-gray-600'
          }`}
        >
          English
        </span>

        {/* ع */}
        <span
          className={`z-10 flex h-full w-1/2 items-center justify-center transition-colors duration-200 ${
            locale === 'ar' ? 'text-white' : 'text-gray-600'
          }`}
        >
          عربية
        </span>
      </button>
    </div>
  );
}
