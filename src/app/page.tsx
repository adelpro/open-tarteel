import { Suspense } from 'react';

import Hero from '@/components/hero';
import SimpleSkeleton from '@/components/simple-skeleton';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale } from '@/lib/seo/routes';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import { getRequestLocale } from '@/utils/request-locale';

import HomeClient from './home-client';

type HomeCopy = {
  appName: string;
  appDescription: string;
};

const COPY: Record<SeoLocale, HomeCopy> = {
  ar: {
    appName: ar.appName,
    appDescription: ar.appDescription,
  },
  en: {
    appName: en.appName,
    appDescription: en.appDescription,
  },
  de: {
    appName: de.appName,
    appDescription: de.appDescription,
  },
};

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const copy = COPY[locale];
  return buildPageMetadata({
    locale,
    path: '/',
    title: `${copy.appName} — Open Tarteel`,
    description: copy.appDescription,
  });
}

export default async function Home() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <Hero />
      <Suspense fallback={<SimpleSkeleton />}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
