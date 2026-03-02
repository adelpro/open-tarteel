'use client';

import dynamic from 'next/dynamic';

import { CtaSkeleton } from './cta-skeleton';

const CtaButton = dynamic(() => import('@/components/home-cta/cta-button'), {
  ssr: false,
  loading: () => <CtaSkeleton />,
});
export default function HomeCTA() {
  return <CtaButton />;
}
