import ReciterPage from '@/app/reciter/[id]/reciter-page';
import Hero from '@/components/hero';
import { clientConfig, normalizeAppUrl } from '@/utils';

// The page is client-driven and loads the reciter by URL. Rendering it on
// demand avoids a pre-rendered shell that Netlify can serve hidden while the
// client hydrates.
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const appUrl = normalizeAppUrl(clientConfig.APP_URL) ?? '';
  const title = `Reciter | ${clientConfig.APP_NAME}`;
  const description = `استمع إلى تلاوات القرآن الكريم | ${clientConfig.APP_NAME}`;

  return {
    metadataBase: new URL(clientConfig.APP_URL),
    title,
    description,
    alternates: {
      canonical: `${appUrl}/reciter/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${appUrl}/reciter/${id}`,
      type: 'website',
      siteName: clientConfig.APP_NAME,
      images: [
        {
          url: '/images/logo-og.png',
          width: 1024,
          height: 1024,
          alt: clientConfig.APP_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/logo-og.png'],
      site: clientConfig.APP_NAME,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <main className="flex w-full flex-col items-center justify-center bg-background text-foreground">
      <Hero />
      <ReciterPage key={id} id={id} />
    </main>
  );
}
