import Hero from '@/components/hero/hero';
import { clientConfig } from '@/utils';

import RecitersPageContent from './_components/reciters-page-content';

export async function generateStaticParams() {
  return [{ locale: 'ar' }, { locale: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appName = clientConfig.APP_NAME;

  if (locale === 'en') {
    return {
      title: `Reciters - English - ${appName}`,
      description: `Reciters page in English for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `Reciters - Arabic - ${appName}`,
    description: `Reciters page in Arabic for ${appName}`,
  };
}

export default async function Page() {
  return (
    <div className="flex w-full flex-col items-center justify-center bg-background text-foreground">
      <Hero />
      <RecitersPageContent />
    </div>
  );
}
