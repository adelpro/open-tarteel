'use client';

import homeSVG from '@svgs/home.svg';
import aboutSVG from '@svgs/info.svg';
import contactSVG from '@svgs/mail.svg';
import PeerSVG from '@svgs/peer.svg';
import privacySVG from '@svgs/privacy.svg';
import savedSVG from '@svgs/saved.svg';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

import SettingsLink from '@/components/footer/settings-link';

import { FooterLink } from '../footer-link';
import { ThemeToggle } from '../thmem-toggle';

const NAV_MAP: {
  src: any;
  path: string;
  alt: string;
  id: string;
  defaultMessage: string;
  onClick?: (event: React.MouseEvent) => void;
}[] = [
  {
    src: homeSVG,
    path: '/',
    alt: 'Home page link',
    id: 'footer.home',
    defaultMessage: 'home',
  },
  {
    src: PeerSVG,
    path: '/reciter',
    alt: 'Reciters page link',
    id: 'footer.reciters',
    defaultMessage: 'Reciters',
  },
  {
    src: savedSVG,
    path: '/library',
    alt: 'library page link',
    id: 'footer.library',
    defaultMessage: 'Library',
  },
  {
    src: aboutSVG,
    path: '/about',
    alt: 'About page link',
    id: 'footer.about',
    defaultMessage: 'About',
  },
  {
    src: privacySVG,
    path: '/privacy',
    alt: 'Privacy page link',
    id: 'footer.privacy',
    defaultMessage: 'Privacy',
  },
  {
    src: contactSVG,
    path: '/contact',
    alt: 'Privacy page link',
    id: 'footer.contact',
    defaultMessage: 'Contact Us',
  },
];
export default function FooterNav() {
  const searchParams = useSearchParams();
  const locale = searchParams.get('locale') ?? 'ar';

  return (
    <nav className="container mx-auto flex h-[var(--footer-height)] items-center gap-6 bg-background sm:gap-4">
      {NAV_MAP.map((item) => (
        <FooterLink key={item.id} href={`/${locale}${item.path}`}>
          <div className="relative flex h-10 w-10 items-center justify-center sm:sr-only">
            <Image
              src={item.src}
              alt={item.alt}
              fill
              className="object-contain"
            />
          </div>
          <span className="sr-only sm:not-sr-only">
            <FormattedMessage
              id={item.id}
              defaultMessage={item.defaultMessage}
            />
          </span>
        </FooterLink>
      ))}
      <SettingsLink />
      <ThemeToggle />
    </nav>
  );
}
