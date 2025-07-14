import homeSVG from '@svgs/home.svg';
import aboutSVG from '@svgs/info.svg';
import contactSVG from '@svgs/mail.svg';
import privacySVG from '@svgs/privacy.svg';
import Image from 'next/image';
import React from 'react';

import { FooterLink } from './footer-link';

export default function Footer() {
  return (
    <div className="mt-5 flex w-full items-center justify-center p-2">
      <div className="align-center flex w-full max-w-2xl flex-row-reverse justify-center gap-3">
        <FooterLink href="/">
          <div className="relative h-8 w-8 sm:h-5 sm:w-5">
            <Image
              src={homeSVG}
              alt="Home page link"
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
    </div>
  );
}
