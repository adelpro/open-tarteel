import { notFound } from 'next/navigation';

import Logo from '@/app/logo';
import ReciterPage from '@/app/reciter/[id]/reciter-page';
import { clientConfig, normalizeAppUrl } from '@/utils';
import { getAllReciters } from '@/utils/api';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  try {
    const RECITERS = await getAllReciters();
    return RECITERS.map((reciter) => ({
      params: {
        id: reciter.id.toString(),
      },
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const RECITERS = await getAllReciters();
  const reciter = RECITERS.find((r) => r.id === Number(id));

  if (!reciter)
    return {
      title: clientConfig.APP_NAME,
    };

  return {
    metadataBase: new URL(clientConfig.APP_URL),
    title: `${reciter.name} | ${clientConfig.APP_NAME}`,
    description: `استمع إلى تلاوات ${reciter.name}`,
    openGraph: {
      title: `${reciter.name} | ${clientConfig.APP_NAME}`,
      description: `استمع إلى تلاوات ${reciter.name}`,
      url: `${normalizeAppUrl(clientConfig.APP_URL)}/reciter/${reciter.id}`,
      images: [
        {
          url: `/logo-og.png`,
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
          url: `/logo-og.png`,
          width: 1024,
          height: 1024,
          alt: 'Quran - القرآن',
        },
      ],
      site: clientConfig.APP_NAME,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  let RECITERS = [];

  try {
    RECITERS = await getAllReciters();
  } catch (error) {
    console.error('Error fetching reciters in page:', error);
    return notFound();
  }

  const reciter = RECITERS.find((r) => r.id === Number(id));

  if (!reciter) {
    return notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org ',
            '@type': 'Person',
            name: reciter.name,
            url: `${normalizeAppUrl(clientConfig.APP_URL)}/reciter/${reciter.id}`,
          }),
        }}
      />
      <main className="flex w-full flex-col items-center justify-center bg-background text-foreground">
        <Logo />
        <ReciterPage id={reciter.id} />
      </main>
    </>
  );
}
