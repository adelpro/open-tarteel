'use client';
import { useAtomValue } from 'jotai';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { fullscreenAtom } from '@/jotai/atom';

export default function Logo() {
  const isFullscreen = useAtomValue(fullscreenAtom);

  if (isFullscreen) {
    return null;
  }

  return (
    <section
      className="relative flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center md:min-h-[70vh]"
      aria-label="Hero section"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="dark:from-blue-500/3 absolute -left-1/4 -top-1/4 h-1/3 w-1/3 animate-pulse rounded-full bg-gradient-to-br from-blue-500/5 via-transparent to-transparent blur-2xl" />
      </div>

      {/* Logo container with subtle hover effect */}
      <div className="group relative mb-6 transform transition-all duration-700 hover:scale-105">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-500/5 blur-lg transition-opacity duration-700 group-hover:opacity-80" />
        <Image
          src="/images/logo.png"
          alt="القرآن الكريم Logo"
          width={160}
          height={160}
          priority
          itemProp="image"
          className="relative rounded-full transition-transform duration-700 group-hover:scale-105 md:h-48 md:w-48"
        />
      </div>

      {/* Main heading with gradient text */}
      <h1
        className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl"
        itemProp="headline"
      >
        <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-blue-300 dark:to-blue-200">
          <FormattedMessage id="appName" />
        </span>
      </h1>

      {/* Description with subtle animation */}
      <p
        className="max-w-md text-lg text-gray-600 dark:text-gray-300 sm:max-w-lg sm:text-xl md:max-w-xl md:text-2xl"
        itemProp="description"
      >
        <FormattedMessage id="appDescription" />
      </p>

      {/* Decorative elements */}
      <div className="mt-8 flex items-center justify-center space-x-2">
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
    </section>
  );
}
