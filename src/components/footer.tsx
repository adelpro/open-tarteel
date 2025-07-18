'use client';

import homeSVG from '@svgs/home.svg';
import aboutSVG from '@svgs/info.svg';
import contactSVG from '@svgs/mail.svg';
import privacySVG from '@svgs/privacy.svg';
import { useSetAtom } from 'jotai';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FaGithub, FaGlobe, FaTag } from 'react-icons/fa';

import { selectedReciterAtom } from '@/jotai/atom';
import { clientConfig } from '@/utils';

import { FooterLink } from './footer-link';

export default function Footer() {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    setAppVersion(clientConfig.APP_VERSION);
  }, []);

  const handleHomeClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedReciter(null);
    router.push('/');
  };

  return (
    <footer className="mt-5 flex w-full flex-col items-center justify-center gap-3 p-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex w-full max-w-2xl flex-row justify-center gap-3">
        <FooterLink href="/" onClick={handleHomeClick}>
          <div className="relative h-8 w-8 sm:h-5 sm:w-5">
            <Image
              src={homeSVG}
              alt="Home page link"
              onClick={handleHomeClick}
              fill
              className="object-contain"
            />
          </div>
          <p className="hidden truncate text-right sm:block">
            الصفحة الرئيسية
          </p>
        </FooterLink>
        <FooterLink href="/about">
          <div className="relative h-8 w-8 sm:h-5 sm:w-5">
            <Image
              src={aboutSVG}
              alt="About page link"
              fill
              className="object-contain"
            />
          </div>
          <p className="hidden truncate text-right sm:block">
            معلومات عن التطبيق
          </p>
        </FooterLink>
        <FooterLink href="/privacy">
          <div className="relative h-8 w-8 sm:h-5 sm:w-5">
            <Image
              src={privacySVG}
              alt="Privacy page link"
              fill
              className="object-contain"
            />
          </div>
          <p className="hidden truncate text-right sm:block">سياسة الخصوصية</p>
        </FooterLink>
        <FooterLink href="/contact">
          <div className="relative h-8 w-8 sm:h-5 sm:w-5">
            <Image
              src={contactSVG}
              alt="Contact page link"
              fill
              className="object-contain"
            />
          </div>
          <p className="hidden truncate text-right sm:block">إتصل بنا</p>
        </FooterLink>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-4 text-xs opacity-80"
        dir="ltr"
      >
        <div className="flex items-center gap-0.5">
          <span>Made with</span>
          <span className="text-red-500">❤️</span>
          <span>by</span>
          <a
            href="https://adelpro.us.kg/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-600 hover:underline dark:text-blue-400"
          >
            adelpro
          </a>
        </div>
        <a
          href="https://github.com/adelpro/open-tarteel"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
        >
          <FaGithub className="h-4 w-4" />
          source
        </a>
        <div className="flex items-center gap-1 font-mono">
          <FaTag className="h-3 w-3" />v{appVersion}
        </div>
      </div>
    </footer>
  );
}
