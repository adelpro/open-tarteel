'use client';

import homeSVG from '@svgs/home.svg';
import aboutSVG from '@svgs/info.svg';
import contactSVG from '@svgs/mail.svg';
import privacySVG from '@svgs/privacy.svg';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormattedMessage } from 'react-intl';

import { selectedReciterAtom } from '@/jotai/atom';

import { FooterLink } from './footer-link';

export default function Footer() {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const handleHomeClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedReciter(null);
    router.push('/');
  };

  return (
    <footer className="fixed bottom-0 left-0 z-50 mt-0 flex w-full flex-row items-center justify-between gap-0 border-t border-gray-200 bg-background p-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400 sm:static sm:mt-5 sm:flex-col sm:justify-center sm:gap-3 sm:border-0 sm:bg-transparent sm:p-4">
      <div className="flex w-full max-w-2xl flex-row justify-center gap-6 sm:gap-3">
        <FooterLink href="/" onClick={handleHomeClick}>
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Image
              src={homeSVG}
              alt="Home page link"
              fill
              className="object-contain"
            />
          </div>
          <span className="sr-only sm:not-sr-only sm:block">
            <FormattedMessage id="footer.home" defaultMessage="Home" />
          </span>
        </FooterLink>
        <FooterLink href="/about">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Image
              src={aboutSVG}
              alt="About page link"
              fill
              className="object-contain"
            />
          </div>
          <span className="sr-only sm:not-sr-only sm:block">
            <FormattedMessage id="footer.about" defaultMessage="About" />
          </span>
        </FooterLink>
        <FooterLink href="/privacy">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Image
              src={privacySVG}
              alt="Privacy page link"
              fill
              className="object-contain"
            />
          </div>
          <span className="sr-only sm:not-sr-only sm:block">
            <FormattedMessage id="footer.privacy" defaultMessage="Privacy" />
          </span>
        </FooterLink>
        <FooterLink href="/contact">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Image
              src={contactSVG}
              alt="Contact page link"
              fill
              className="object-contain"
            />
          </div>
          <span className="sr-only sm:not-sr-only sm:block">
            <FormattedMessage id="footer.contact" defaultMessage="contact us" />
          </span>
        </FooterLink>
      </div>
    </footer>
  );
}
