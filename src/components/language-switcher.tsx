'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);
  const isArabic = locale === 'ar';

  return (
    <button
      type="button"
      onClick={() => setLocale(isArabic ? 'en' : 'ar')}
      className="relative grid h-6 w-20 grid-cols-2 overflow-hidden rounded-full border border-gray-300 bg-white text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Moving background indicator */}
      <span
        className={`absolute bottom-0 left-0 top-0 w-1/2 rounded-full bg-gray-900 transition-transform duration-200 ease-out ${
          isArabic ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      {/* EN - Always on the left */}
      <span
        className={`z-10 flex items-center justify-center transition-colors duration-200 ${
          isArabic ? 'text-gray-600' : 'text-white'
        }`}
      >
        EN
      </span>

      {/* AR - Always on the right */}
      <span
        className={`z-10 flex items-center justify-center leading-none transition-colors duration-200 ${
          isArabic ? 'text-white' : 'text-gray-600'
        }`}
        style={{ paddingTop: '1px' }}
      >
        AR
      </span>
    </button>
  );
}
