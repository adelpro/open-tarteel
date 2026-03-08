'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  const toggleLocale = () => setLocale(locale === 'ar' ? 'en' : 'ar');

  return (
    <button
      onClick={toggleLocale}
      aria-label="Switch language"
      className={[
        'flex h-8 min-w-[2.75rem] items-center justify-center rounded-full px-3',
        'border text-xs font-bold tracking-wider',
        'transition-all duration-200',
        'focus:-visible:ring-accent·focus:outline-none·focus-visible:ring-2 focus-visible:ring-offset-2',
        'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-zinc-300 hover:bg-white',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700',
      ].join(' ')}
    >
      {locale === 'ar' ? 'EN' : 'AR'}
    </button>
  );
}
