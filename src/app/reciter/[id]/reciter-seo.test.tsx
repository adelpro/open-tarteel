import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import type { Reciter } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import ReciterSeo from './reciter-seo';

const makeReciter = (moshafId: string, name: string): Reciter => ({
  id: 'itqan.dev-2',
  name: 'Badr Al-Turki',
  source: LinkSource.ITQAN,
  moshaf: {
    id: moshafId,
    name,
    riwaya: Riwaya.Hafs,
    server: '',
    surah_total: '114',
    playlist: [],
  },
});

describe('ReciterSeo', () => {
  it('lists every moshaf of the reciter', () => {
    const first = makeReciter('11', 'Hafs');
    const second = makeReciter('12', 'Warsh');

    render(
      <IntlProvider locale="ar" messages={{}}>
        <ReciterSeo reciter={first} locale="ar" variants={[first, second]} />
      </IntlProvider>
    );

    expect(screen.getAllByText('Hafs').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Warsh' })).toHaveAttribute(
      'href',
      '/reciter/itqan.dev-2?moshafId=12'
    );
  });
});
