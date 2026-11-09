'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MdExpandMore } from 'react-icons/md';
import { useIntl } from 'react-intl';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import { stripLocale, withLocale } from '@/lib/seo/routes';

export default function LanguageSwitcher() {
  const { formatMessage, locale } = useIntl();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (language: Language) => {
    router.push(withLocale(language, stripLocale(pathname)));
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
