'use client';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

export default function Hero() {
  return (
    <section
      className="mt-10 flex flex-col items-center justify-center px-4 text-center"
      aria-label="Hero section"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <div className="mb-6 flex justify-center">
        <Image
          src="/images/logo.png"
          alt="القرآن الكريم Logo"
          width={200}
          height={200}
          priority
          itemProp="image"
        />
      </div>
      <h1 className="mb-3 text-4xl font-extrabold" itemProp="headline">
        <FormattedMessage id="appName" />
      </h1>
      <p
        className="max-w-lg text-lg text-gray-700 dark:text-gray-300"
        itemProp="description"
      >
        <FormattedMessage id="appDescription" />
      </p>
    </section>
  );
}
