import { notFound } from 'next/navigation';

import Hero from '@/components/hero';
import { breadcrumbTrail } from '@/lib/seo/json-ld';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { type SeoLocale, withLocale } from '@/lib/seo/routes';
import { SITE } from '@/lib/seo/site';
import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';
import { getReciterPlaylistCached } from '@/services/reciters/cached';
import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';
import { buildLocalPlaylist } from '@/utils/build-local-playlist';

import ReciterPage from './reciter-page';

const COPY = { ar, en, de } as const;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moshafId?: string; surah?: string }>;
};

type FindResult = { status: 'ok'; variants: Reciter[] } | { status: 'error' };

const findVariants = async (
  id: string,
  locale: SeoLocale
): Promise<FindResult> => {
  try {
    const reciters = await getAllReciters(locale);
    return {
      status: 'ok',
      variants: reciters.filter((reciter) => reciter.id === id),
    };
  } catch {
    return { status: 'error' };
  }
};

const descriptionFor = (
  locale: SeoLocale,
  reciter: Reciter,
  moshafName: string
) => {
  const template = COPY[locale]['reciter.description'];
  return template
    .replace('{name}', reciter.name)
    .replace('{moshaf}', moshafName);
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const locale = 'ar' as const;
  const result = await findVariants(id, locale);
  if (result.status === 'error') {
    return {
      title: 'Reciter temporarily unavailable — Open Tarteel',
      robots: { index: false, follow: false },
    };
  }

  const reciter =
    result.variants.find((item) => item.moshaf.id === query.moshafId) ??
    result.variants[0];

  if (!reciter) {
    return {
      title: 'Reciter not found — Open Tarteel',
      robots: { index: false, follow: false },
    };
  }

  return buildPageMetadata({
    locale,
    path: `/reciter/${id}`,
    title: `${reciter.name} — ${reciter.moshaf.name} | Open Tarteel`,
    description: descriptionFor(locale, reciter, reciter.moshaf.name),
    omitLanguages: true,
  });
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const locale = 'ar' as const;
  const result = await findVariants(id, locale);

  if (result.status === 'error') {
    throw new Error('Reciter catalogue unavailable');
  }

  const variants = result.variants;
  if (variants.length === 0) {
    notFound();
  }

  const requestedMoshafId = query.moshafId;
  const selected =
    variants.find((reciter) => reciter.moshaf.id === requestedMoshafId) ??
    variants[0];

  if (!selected) {
    notFound();
  }

  const local = buildLocalPlaylist(selected);
  let playlist = local ?? [];
  if (playlist.length === 0) {
    try {
      playlist =
        (await getReciterPlaylistCached(
          selected.source,
          selected.moshaf,
          locale
        )) ?? [];
    } catch {
      // The client page retries the detail; the SEO content still renders.
    }
  }

  const reciter: Reciter = {
    ...selected,
    moshaf: { ...selected.moshaf, playlist },
  };

  const rawSurah = Number(query.surah);
  const initialSurah =
    Number.isInteger(rawSurah) && rawSurah >= 1 && rawSurah <= 114
      ? rawSurah
      : undefined;

  const canonicalPath = `/reciter/${id}`;
  const breadcrumb = breadcrumbTrail([
    {
      name: locale === 'ar' ? 'الرئيسية' : 'Home',
      url: `${SITE.url}${withLocale(locale, '/')}`,
    },
    {
      name: reciter.name,
      url: `${SITE.url}${withLocale(locale, canonicalPath)}`,
    },
  ]);
  return (
    <main className="flex w-full flex-col items-center justify-center bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c'),
        }}
      />
      <Hero />
      <ReciterPage
        id={id}
        initialReciter={reciter}
        initialSurah={initialSurah}
      />
    </main>
  );
}
