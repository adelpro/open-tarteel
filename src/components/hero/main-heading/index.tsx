'use client';

import { FormattedMessage } from 'react-intl';

export default function MainHeading() {
  return (
    <h1
      className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-6xl"
      itemProp="headline"
    >
      <span className="dark:via-brand-CTA-blue-400 dark:to-brand-CTA-blue-300 bg-gradient-to-r from-brand-CTA-blue-600 via-brand-CTA-blue-500 to-brand-CTA-blue-500 bg-clip-text text-transparent dark:from-brand-CTA-blue-500">
        <FormattedMessage id="appName" />
      </span>
    </h1>
  );
}
