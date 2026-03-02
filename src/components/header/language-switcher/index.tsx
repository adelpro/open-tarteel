'use client';

import { useAtom, useAtomValue } from 'jotai';
import { usePathname, useRouter } from 'next/navigation';
import { ComponentPropsWithoutRef } from 'react';

import { fullscreenAtom } from '@/jotai';
import { localeAtom } from '@/jotai/atoms';
import { LocaleType } from '@/types';
import { cn } from '@/utils';

type Props = ComponentPropsWithoutRef<'button'>;

export default function LanguageSwitcher({
  className,
  ...props
}: Readonly<Props>) {
  const [locale, setLocale] = useAtom(localeAtom);
  const isFullscreen = useAtomValue(fullscreenAtom);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';

    setLocale(nextLocale);

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      router.replace(`/${nextLocale}`);
      return;
    }

    segments[0] = nextLocale;
    router.replace(`/${segments.join('/')}`);
  };

  if (isFullscreen) return;

  return (
    <button
      dir={'ltr'}
      type="button"
      className={cn(
        'relative flex h-8 w-24 cursor-pointer items-center overflow-hidden rounded-full border border-gray-300 bg-white text-[10px] font-semibold leading-none shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 sm:w-32 sm:text-sm',
        className
      )}
      aria-label="Switch language"
      {...props}
      onClick={() => handleClick()}
    >
      <Indicator locale={locale} />

      {/* EN */}
      <span
        className={`z-10 flex h-full w-1/2 items-center justify-center transition-colors duration-200 ${
          locale === 'en' ? 'text-white' : 'text-gray-600'
        }`}
      >
        English
      </span>

      {/* ع */}
      <span
        className={`z-10 flex h-full w-1/2 items-center justify-center transition-colors duration-200 ${
          locale === 'ar' ? 'text-white' : 'text-gray-600'
        }`}
      >
        عربية
      </span>
    </button>
  );
}
const Indicator = ({ locale }: { readonly locale: LocaleType }) => (
  <span
    className={`absolute bottom-0 left-0 top-0 w-1/2 rounded-full bg-gray-900 transition-transform duration-200 ease-out ${
      locale === 'ar' ? 'translate-x-full' : 'translate-x-0'
    }`}
  />
);
