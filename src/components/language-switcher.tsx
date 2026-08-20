'use client';

import { useAtom } from 'jotai';
import { useState } from 'react';
import { IoLanguageOutline } from 'react-icons/io5';
import { localeAtom } from '@/jotai/atom';
import { LANGUAGES } from '@/constants/language';
import type { Language } from '@/constants/language';
import { useIntl } from 'react-intl';

export default function LanguageSwitcher() {
  const { formatMessage } = useIntl();
  const [locale, setLocale] = useAtom(localeAtom);
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setLocale(language);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={formatMessage({
          id: 'language.select',
          defaultMessage: 'Select language',
        })}
        aria-expanded={isOpen}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-brand-CTA-blue-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
      >
        <IoLanguageOutline className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 min-w-32 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {Object.entries(LANGUAGES).map(([code, config]) => (
            <button
              key={code}
              type="button"
              onClick={() => handleLanguageChange(code as Language)}
              className={[
                'flex w-full items-center px-3 py-2 text-left text-sm',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                locale === code
                  ? 'font-semibold text-brand-CTA-blue-500'
                  : 'text-gray-700 dark:text-gray-200',
              ].join(' ')}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
