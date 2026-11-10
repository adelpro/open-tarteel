import { Suspense } from 'react';

import Hero from '@/components/hero';
import HomeClient from '@/components/home-client';
import SimpleSkeleton from '@/components/simple-skeleton';
import { buildPageMetadata } from '@/lib/seo/metadata';
import type { SeoLocale } from '@/lib/seo/routes';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

const COPY = { ar, en, de } as const;

export const homeMetadata = (locale: SeoLocale) => {
  const copy = COPY[locale];

  return buildPageMetadata({
    locale,
    path: '/',
    title: `${copy.appName} — Open Tarteel`,
    description: copy.appDescription,
  });
};

export function HomeRoute() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <Hero />
      <Suspense fallback={<SimpleSkeleton />}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
