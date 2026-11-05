import ReciterPage from '@/app/reciter/[id]/reciter-page';
import Hero from '@/components/hero';
import type { LinkSource } from '@/types';
import { clientConfig, normalizeAppUrl } from '@/utils';
import { getAllReciters } from '@/utils/api';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moshafId?: string }>;
};

/** `itqan.dev-2` → `itqan.dev`; `mp3quran.net-1` → `mp3quran.net`. */
const sourceFromId = (id: string): LinkSource | null => {
  const index = id.lastIndexOf('-');
  if (index <= 0) return null;
  const candidate = id.slice(0, index);
  return candidate.includes('.') ? (candidate as LinkSource) : null;
};

export async function generateStaticParams() {
  try {
    const RECITERS = await getAllReciters('ar', null);
    // A reciter can expose multiple moshaf entries; Next only needs one path.
    return [...new Set(RECITERS.map((reciter) => reciter.id))].map((id) => ({
      id,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const source = sourceFromId(id);

  let RECITERS: Awaited<ReturnType<typeof getAllReciters>> = [];
  try {
    // Scope the lookup to this provider instead of fetching every catalog.
    RECITERS = await getAllReciters('ar', source ? [source] : null);
  } catch {
    return {
      title: clientConfig.APP_NAME,
    };
  }

  const reciter = RECITERS.find((r) => r.id === id);

  if (!reciter) {
    return {
      title: clientConfig.APP_NAME,
    };
  }

  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';

  return {
    metadataBase: new URL(clientConfig.APP_URL),
    title: `${reciter.name} | ${clientConfig.APP_NAME}`,
    description: `استمع إلى تلاوات ${reciter.name}`,
    alternates: {
      canonical: `${appUrl}/reciter/${reciter.id}`,
    },
    openGraph: {
      title: `${reciter.name} | ${clientConfig.APP_NAME}`,
      description: `استمع إلى تلاوات ${reciter.name}`,
      url: `${appUrl}/reciter/${reciter.id}`,
      images: [
        {
          url: '/images/logo-og.png',
          width: 1024,
          height: 1024,
          alt: clientConfig.APP_NAME,
        },
      ],
      siteName: clientConfig.APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${reciter.name} | ${clientConfig.APP_NAME}`,
      description: `استمع إلى تلاوات ${reciter.name}`,
      images: [
        {
          url: '/images/logo-og.png',
          width: 1024,
          height: 1024,
          alt: 'Quran - القرآن',
        },
      ],
      site: clientConfig.APP_NAME,
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { moshafId } = await searchParams;

  // Do not block the page on the catalog. The client loads the reciter and its
  // playlist by URL, so a slow provider never leaves the page on a skeleton.
  return (
    <main className="flex w-full flex-col items-center justify-center bg-background text-foreground">
      <Hero />
      <ReciterPage key={id} id={id} moshafId={moshafId} />
    </main>
  );
}
