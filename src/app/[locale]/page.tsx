import Hero from '@/components/hero/hero';
import HomeCTA from '@/components/home-cta';
import { clientConfig } from '@/utils';

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
      title: `Home - English - ${appName}`,
      description: `Home page in English for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `Home - Arabic - ${appName}`,
    description: `Home page in Arabic for ${appName}`,
  };
}

export default async function Page() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-y-4 text-foreground">
      <Hero />
      <HomeCTA />
    </div>
  );
}
