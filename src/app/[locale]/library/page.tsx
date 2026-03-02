import Container from '@/components/container';
import { clientConfig } from '@/utils';

import LibraryPageContent from './_components';

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
      title: `Library - English - ${appName}`,
      description: `Library page in English for ${appName}`,
    };
  }

  // default Arabic
  return {
    title: `Library - Arabic - ${appName}`,
    description: `Library page in Arabic for ${appName}`,
  };
}

export default async function Page() {
  return (
    <Container className="flex h-full flex-col gap-4 overflow-hidden">
      <LibraryPageContent />
    </Container>
  );
}
