import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useIntl } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

import IntlProviderWrapper from './intl-provider-wrapper';

vi.mock('next/navigation', () => ({
  usePathname: () => '/reciter/x',
}));

function LocaleProbe() {
  const { locale } = useIntl();
  return <span data-testid="locale">{locale}</span>;
}

describe('IntlProviderWrapper', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('uses the lang query parameter for a bare reciter URL', async () => {
    window.history.replaceState({}, '', '/reciter/x?moshafId=1&lang=en');

    render(
      <IntlProviderWrapper initialLocale="ar">
        <LocaleProbe />
      </IntlProviderWrapper>
    );

    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('en')
    );
  });

  it('falls back to the pathname locale when lang is absent', async () => {
    window.history.replaceState({}, '', '/reciter/x?moshafId=1');

    render(
      <IntlProviderWrapper initialLocale="ar">
        <LocaleProbe />
      </IntlProviderWrapper>
    );

    await waitFor(() =>
      expect(screen.getByTestId('locale')).toHaveTextContent('ar')
    );
  });
});
