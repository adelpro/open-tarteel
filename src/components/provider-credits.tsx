import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

const PROVIDERS = [
  {
    name: 'MP3Quran',
    href: 'https://mp3quran.net',
    logo: '/images/providers/mp3quran.svg',
  },
  {
    name: 'Quran Foundation',
    href: 'https://quran.foundation',
    logo: '/images/providers/quran-foundation.svg',
  },
  {
    name: 'Itqan',
    href: 'https://itqan.dev',
    logo: '/images/providers/itqan.svg',
  },
  {
    name: 'Qurani.ai',
    href: 'https://qurani.ai',
    logo: '/images/providers/qurani-ai.svg',
  },
] as const;

/** Simple, local credit block: the APIs behind the recitation catalogue. */
export function ProviderCredits() {
  return (
    <section className="mt-6">
      <h3 className="mb-1 text-lg font-bold">
        <FormattedMessage
          id="about.providers.creditsTitle"
          defaultMessage="API providers"
        />
      </h3>
      <p className="text-sm text-ink-muted">
        <FormattedMessage
          id="about.providers.thanks"
          defaultMessage="Thank you to the API providers whose recitations make this app possible."
        />
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PROVIDERS.map((provider) => (
          <li key={provider.name}>
            <a
              href={provider.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={provider.name}
              className="focus-ring flex h-14 items-center justify-center rounded-control border border-border bg-surface p-2 transition-colors duration-120 hover:bg-surface-sunken"
            >
              <Image
                src={provider.logo}
                alt={provider.name}
                width={96}
                height={32}
                unoptimized
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
