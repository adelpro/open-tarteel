import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import DesignPreview from './design-preview';

export const metadata: Metadata = {
  title: 'Design tokens',
  robots: { index: false, follow: false },
};

export default function DesignPreviewPage() {
  // Internal visual harness — never shipped in production.
  if (process.env.NODE_ENV === 'production') notFound();

  return <DesignPreview />;
}
