'use client';

import { usePathname, useRouter } from 'next/navigation';
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
    // One arrow only: the Tailwind forms plugin draws the platform arrow in
    // the select's background. A second custom chevron made two arrows.
    <select
      value={locale}
      onChange={(event) =>
        handleLanguageChange(event.target.value as Language)
      }
      aria-label={formatMessage({
        id: 'language.select',
        defaultMessage: 'Select language',
      })}
      className="focus-ring h-11 rounded-[8px] border border-border bg-surface pe-9 ps-3 text-[13px] font-bold text-ink"
    >
      {Object.entries(LANGUAGES).map(([code, config]) => (
        <option key={code} value={code}>
          {config.label}
        </option>
      ))}
    </select>
  );
}
