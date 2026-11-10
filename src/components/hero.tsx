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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="dark:from-brand-CTA-blue-500/3 absolute -left-1/4 -top-1/4 h-1/3 w-1/3 animate-pulse rounded-full bg-gradient-to-br from-brand-CTA-blue-500/5 via-transparent to-transparent blur-2xl" />
      </div>

      {/* Logo container with subtle hover effect */}
      <div className="group relative mb-6 transform transition-all duration-700 hover:scale-105">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-CTA-blue-500/10 to-brand-CTA-blue-500/5 blur-lg transition-opacity duration-700 group-hover:opacity-80" />
        <Image
          src="/images/logo-384.webp"
          alt="القرآن الكريم Logo"
          width={160}
          height={160}
          priority
          unoptimized
          itemProp="image"
          className="relative rounded-full transition-transform duration-700 group-hover:scale-105 md:h-48 md:w-48"
        />
      </div>

      {/* Main heading with gradient text */}
      <h1
        className="mb-4 text-3xl font-black tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-6xl"
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
