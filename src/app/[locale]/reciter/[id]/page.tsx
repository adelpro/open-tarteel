import { ReciterJsonld } from '@/components/reciter-jsonld';
import { LocaleType } from '@/types';
import { clientConfig } from '@/utils';
import { getAllReciters } from '@/utils/api';

import ReciterPage from './_components/reciter-content';

type Props = {
  params: Promise<{ id: string; locale: LocaleType }>;
};

const LOCALES = ['ar', 'en'] as const;

export async function generateStaticParams() {
  try {
    const RECITERS = await getAllReciters();

    return RECITERS.flatMap((reciter) =>
      LOCALES.map((locale) => ({
        id: reciter.id.toString(),
        locale,
      }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { id, locale } = await params;

  const appName = clientConfig.APP_NAME;

  const baseUrl = clientConfig.APP_URL.endsWith('/')
    ? clientConfig.APP_URL
    : clientConfig.APP_URL + '/';

  let reciter = null;

  try {
    const RECITERS = await getAllReciters(locale);
    reciter = RECITERS.find((r) => r.id === id);
  } catch (err) {
    console.error('[Meta data]: getReciters Error:', err);
  }

  if (!reciter) {
    return {
      title: appName,
      description: locale === 'en' ? 'Reciter not found' : 'المقرئ غير موجود',
    };
  }

  const description =
    locale === 'en'
      ? `Listen to recitations of ${reciter.name}`
      : `استمع إلى تلاوات ${reciter.name}`;

  const fullUrl = `${baseUrl}${locale}/reciter/${reciter.id}`;

  return {
    metadataBase: new URL(baseUrl),
    title: `${reciter.name} | ${appName}`,
    description,
    openGraph: {
      title: `${reciter.name} | ${appName}`,
      description,
      url: fullUrl,
      images: [
        {
          url: new URL('/logo-og.png', baseUrl).toString(),
          width: 1024,
          height: 1024,
          alt: appName,
        },
      ],
      siteName: appName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${reciter.name} | ${appName}`,
      description,
      images: [new URL('/logo-og.png', baseUrl).toString()],
    },
  };
}

export default async function Page({ params }: Readonly<Props>) {
  const { id, locale } = await params;
  const RECITERS = await getAllReciters(locale);
  const reciter = RECITERS.find((r) => r.id === id);

  return (
    <>
      <ReciterPage
        key={`${reciter?.id}-${reciter?.moshaf.id}`}
        reciter={reciter}
      />
      <ReciterJsonld reciter={reciter} />
    </>
  );
}
