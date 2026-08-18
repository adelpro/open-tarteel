'use client';

import { useAtom } from 'jotai';

import { localeAtom } from '@/jotai/atom';
import { Language } from '@/constants/language';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useAtom(localeAtom);

  

  return (
    
    <select value={locale} onChange={(e) => setLocale(e.target.value as Language)}>
      <option value="ar">AR</option>
      <option value="en">EN</option>
      <option value="de">DE</option>
    </select>
  );
}
