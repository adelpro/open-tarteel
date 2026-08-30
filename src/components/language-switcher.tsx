'use client';

import { useAtom } from 'jotai';
import { useIntl } from 'react-intl';

import { localeAtom } from '@/jotai/atom';

const COOKIE_NAME = 'locale';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default function LanguageSwitcher() {
  const { locale } = useIntl();
  const [, setLocale] = useAtom(localeAtom);

  const toggleLocale = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    setLocale(nextLocale);
    document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  };

  return (
    <button
      onClick={toggleLocale}
      aria-label="Switch language"
      className={[
        'z-50 flex h-8 w-10 items-center justify-center rounded-full',
        'border border-gray-300 bg-white text-gray-600 shadow-sm',
        'transition-all duration-200 hover:bg-gray-50 hover:text-gray-900',
        'focus:outline-none focus:ring-brand-CTA-blue-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'text-sm font-semibold dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100',
      ].join(' ')}
    >
      {locale === 'ar' ? 'EN' : 'AR'}
    </button>
  );
}
