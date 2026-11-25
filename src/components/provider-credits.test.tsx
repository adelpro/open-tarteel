import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import en from '@/locales/en.json';

import { ProviderCredits } from './provider-credits';

const providers = [
  { name: 'MP3Quran', href: 'https://mp3quran.net', logo: 'mp3quran.svg' },
  {
    name: 'Quran Foundation',
    href: 'https://quran.foundation',
    logo: 'quran-foundation.svg',
  },
  { name: 'Itqan', href: 'https://itqan.dev', logo: 'itqan.svg' },
  { name: 'Qurani.ai', href: 'https://qurani.ai', logo: 'qurani-ai.svg' },
];

describe('ProviderCredits', () => {
  it('thanks every API provider and links to its site', () => {
    render(
      <IntlProvider locale="en" messages={en}>
        <ProviderCredits />
      </IntlProvider>
    );

    expect(screen.getByText(en['about.providers.thanks'])).toBeInTheDocument();

    for (const provider of providers) {
      const link = screen.getByRole('link', { name: provider.name });
      expect(link).toHaveAttribute('href', provider.href);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(screen.getByRole('img', { name: provider.name })).toHaveAttribute(
        'src',
        `/images/providers/${provider.logo}`
      );
    }
  });
});
