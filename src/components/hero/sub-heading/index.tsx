'use client';

import { FormattedMessage } from 'react-intl';

export default function SubHeading() {
  return (
    <p
      className="max-w-md text-lg text-gray-600 dark:text-gray-300 sm:max-w-lg sm:text-xl md:max-w-xl md:text-2xl"
      itemProp="description"
    >
      <FormattedMessage id="appDescription" />
    </p>
  );
}
