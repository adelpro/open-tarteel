import { Suspense } from 'react';

import Hero from '@/components/hero';
import LocalizedLink from '@/components/localized-link';
import SimpleSkeleton from '@/components/simple-skeleton';
import { itemList } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale, withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import { getAllReciters } from '@/utils/api';
import { getRequestLocale } from '@/utils/request-locale';

import HomeClient from './home-client';

type HomeCopy = {
  appName: string;
  appDescription: string;
  recitersTitle: string;
  recitersDescription: string;
};

const COPY: Record<SeoLocale, HomeCopy> = {
  ar: {
    appName: ar.appName,
    appDescription: ar.appDescription,
    recitersTitle: ar['home.recitersTitle'],
    recitersDescription: ar['home.recitersDescription'],
  },
  en: {
    appName: en.appName,
    appDescription: en.appDescription,
    recitersTitle: en['home.recitersTitle'],
    recitersDescription: en['home.recitersDescription'],
  },
  de: {
    appName: de.appName,
    appDescription: de.appDescription,
    recitersTitle: de['home.recitersTitle'],
    recitersDescription: de['home.recitersDescription'],
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
  const locale = await getRequestLocale();
  const copy = COPY[locale];

  let reciters: Awaited<ReturnType<typeof getAllReciters>> = [];
  try {
    reciters = await getAllReciters(locale);
  } catch {
    // The interactive selector still works; the crawlable list is best-effort.
  }

  const seen = new Set<string>();
  const homeReciters = reciters
    .filter((reciter) => {
      if (seen.has(reciter.id)) return false;
      seen.add(reciter.id);
      return true;
    })
    .slice(0, 12);

  const reciterList = itemList(
    copy.recitersTitle,
    homeReciters.map((reciter) => ({
      name: `${reciter.name} — ${reciter.moshaf.name}`,
      url: `${SITE.url}${withLocale(locale, `/reciter/${reciter.id}`)}`,
    }))
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reciterList).replace(/</g, '\\u003c'),
        }}
      />
      <Hero />

      {homeReciters.length > 0 ? (
        <section className="mx-auto w-full max-w-lg px-2">
          <h2 className="text-[1.125rem] font-bold text-ink">
            {copy.recitersTitle}
          </h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            {copy.recitersDescription}
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {homeReciters.map((reciter) => (
              <li key={reciter.id}>
                <LocalizedLink
                  href={`/reciter/${reciter.id}`}
                  className="text-[13px] font-medium text-primary hover:text-primary-hover"
                >
                  {reciter.name}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Suspense fallback={<SimpleSkeleton />}>
        <HomeClient />
      </Suspense>
    </div>
  );
}
