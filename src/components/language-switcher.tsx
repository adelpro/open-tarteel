'use client';

import { useAtom } from 'jotai';
import { MdExpandMore } from 'react-icons/md';
import { useIntl } from 'react-intl';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import { localeAtom } from '@/jotai/atom';

const COOKIE_NAME = 'locale';
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export default function LanguageSwitcher() {
  const { formatMessage, locale } = useIntl();
  const [, setLocale] = useAtom(localeAtom);

  const handleLanguageChange = (language: Language) => {
    setLocale(language);
    document.cookie = `${COOKIE_NAME}=${language}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={locale}
        onChange={(event) =>
          handleLanguageChange(event.target.value as Language)
        }
        aria-label={formatMessage({
          id: 'language.select',
          defaultMessage: 'Select language',
        })}
        className="focus-visible:ring-primary/35 h-10 appearance-none rounded-[8px] border border-border bg-surface pe-9 ps-3 text-[13px] font-bold text-ink focus:outline-none focus-visible:ring-2"
      >
        {Object.entries(LANGUAGES).map(([code, config]) => (
          <option key={code} value={code}>
            {config.label}
          </option>
        ))}
      </select>
      <MdExpandMore
        className="pointer-events-none absolute end-2 size-4 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
}
