'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { fullscreenAtom } from '@/jotai/atom';

export default function Hero() {
  const isFullscreen = useAtomValue(fullscreenAtom);

  if (isFullscreen) {
    return null;
  }

  return (
    <section
      className="relative flex flex-col items-center justify-center p-1 text-center md:p-4"
      aria-label="Hero section"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <div className="relative mb-6">
        <Image
          src="/images/logo-384.webp"
          alt="القرآن الكريم Logo"
          width={160}
          height={160}
          priority
          fetchPriority="high"
          unoptimized
          itemProp="image"
          className="relative rounded-full md:h-48 md:w-48"
        />
      </div>

      <h1
        className="mb-4 text-3xl font-black text-ink sm:text-4xl md:text-5xl lg:text-6xl"
        itemProp="headline"
      >
        <span className="text-primary">
          <FormattedMessage id="appName" />
        </span>
      </h1>

      {/* Description with subtle animation */}
      <p
        className="max-w-md text-lg text-ink-muted sm:max-w-lg sm:text-xl md:max-w-xl md:text-2xl"
        itemProp="description"
      >
        <FormattedMessage id="appDescription" />
      </p>
    </section>
  );
}
