import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import LocalizedLink from './localized-link';

describe('LocalizedLink', () => {
  it('prefixes the current locale', () => {
    render(
      <IntlProvider locale="en" messages={{}}>
        <LocalizedLink href="/about">About</LocalizedLink>
      </IntlProvider>
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/en/about');
  });

  it('keeps Arabic bare', () => {
    render(
      <IntlProvider locale="ar" messages={{}}>
        <LocalizedLink href="/about">حول</LocalizedLink>
      </IntlProvider>
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/about');
  });
});
