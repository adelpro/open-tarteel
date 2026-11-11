'use client';

import homeSVG from '@svgs/home.svg';
import aboutSVG from '@svgs/info.svg';
import contactSVG from '@svgs/mail.svg';
import privacySVG from '@svgs/privacy.svg';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { IoSettingsOutline } from 'react-icons/io5';
import { FormattedMessage } from 'react-intl';

import { useLocalePath } from '@/hooks/use-locale-path';
import { selectedReciterAtom } from '@/jotai/atom';

import { FooterLink } from './footer-link';

export default function Footer() {
  const router = useRouter();
  const localePath = useLocalePath();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const handleHomeClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedReciter(null);
    router.push(localePath('/'));
  };

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex w-full flex-row items-center justify-center gap-6 border-t border-border bg-background px-4 py-2 text-sm backdrop-blur-md">
      <div className="flex w-full max-w-2xl flex-row justify-center gap-8 sm:gap-8">
        <FooterLink href="/" onClick={handleHomeClick}>
          <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
          <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
          <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
          <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
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
        <FooterLink href="/settings">
          <div className="relative flex h-5 w-5 items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <IoSettingsOutline className="size-6 text-current" />
          </div>
          <span className="sr-only sm:not-sr-only sm:block">
            <FormattedMessage id="footer.settings" defaultMessage="Settings" />
          </span>
        </FooterLink>
      </div>
    </footer>
  );
}
