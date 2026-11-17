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
    // Replace, not push: a push leaves this same page in the old language
    // underneath, so the back arrow returned to it instead of going home.
    router.replace(withLocale(language, stripLocale(pathname)));
  };

  return (
    // No custom chevron: a browser that keeps its own arrow alongside ours drew
    // two. The platform control draws exactly one, and pads for it itself.
    <select
      value={locale}
      onChange={(event) => handleLanguageChange(event.target.value as Language)}
      aria-label={formatMessage({
        id: 'language.select',
        defaultMessage: 'Select language',
      })}
      className="focus-visible:ring-primary/35 h-10 rounded-[8px] border border-border bg-surface px-3 text-[13px] font-bold text-ink focus:outline-none focus-visible:ring-2"
    >
      {Object.entries(LANGUAGES).map(([code, config]) => (
        <option key={code} value={code}>
          {config.label}
        </option>
      ))}
    </select>
  );
}
