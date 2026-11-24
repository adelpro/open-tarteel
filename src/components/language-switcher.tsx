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
    // One arrow only: the Tailwind forms plugin draws the platform arrow in
    // the select's background. A second custom chevron made two arrows.
    <select
      value={locale}
      onChange={(event) => handleLanguageChange(event.target.value as Language)}
      aria-label={formatMessage({
        id: 'language.select',
        defaultMessage: 'Select language',
      })}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={
        locale === 'ar'
          ? 'focus-ring h-11 rounded-[8px] border border-border bg-surface bg-[position:left_0.75rem_center] pl-9 pr-3 text-[13px] font-bold text-ink'
          : 'focus-ring h-11 rounded-[8px] border border-border bg-surface pl-3 pr-9 text-[13px] font-bold text-ink'
      }
    >
      {Object.entries(LANGUAGES).map(([code, config]) => (
        <option key={code} value={code}>
          {config.label}
        </option>
      ))}
    </select>
  );
}
