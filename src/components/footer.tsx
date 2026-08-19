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
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { selectedReciterAtom } from '@/jotai/atom';
import { FooterLink } from './footer-link';
import React from 'react';

type FooterItem = {
  href: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  icon: React.ReactNode;
  labelId: string;
  defaultLabel: string;
};

export default function Footer() {
  const router = useRouter();
  const setSelectedReciter = useSetAtom(selectedReciterAtom);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleHomeClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSelectedReciter(null);
    router.push('/');
  };

  const footerItems: FooterItem[] = [
    {
      href: '/',
      onClick: handleHomeClick,
      icon: (
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Image src={homeSVG} alt="Home" fill className="object-contain" />
        </div>
      ),
      labelId: 'footer.home',
      defaultLabel: 'الرئيسية',
    },
    {
      href: '/about',
      icon: (
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Image src={aboutSVG} alt="About" fill className="object-contain" />
        </div>
      ),
      labelId: 'footer.about',
      defaultLabel: 'عن التطبيق',
    },
    {
      href: '/privacy',
      icon: (
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Image src={privacySVG} alt="Privacy" fill className="object-contain" />
        </div>
      ),
      labelId: 'footer.privacy',
      defaultLabel: 'الخصوصية',
    },
    {
      href: '/contact',
      icon: (
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Image src={contactSVG} alt="Contact" fill className="object-contain" />
        </div>
      ),
      labelId: 'footer.contact',
      defaultLabel: 'تواصل معنا',
    },
    {
      href: '/settings',
      icon: (
        <div className="relative flex h-5 w-5 items-center justify-center">
          <IoSettingsOutline className="size-5 text-current" />
        </div>
      ),
      labelId: 'footer.settings',
      defaultLabel: 'الإعدادات',
    },
  ];

  return (
    <footer className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300">
      <div className="flex items-center justify-center gap-1 sm:gap-3 rounded-2xl border border-slate-800/80 bg-[#1a1f2e]/90 p-2 shadow-2xl backdrop-blur-xl">
        {footerItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <motion.div
              className="relative flex flex-col items-center"
              onHoverStart={() => setHoveredItem(item.href)}
              onHoverEnd={() => setHoveredItem(null)}
            >
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <FooterLink href={item.href} onClick={item.onClick}>
                  {item.icon}
                </FooterLink>
              </motion.div>

              <AnimatePresence>
                {hoveredItem === item.href && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-8 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white shadow-lg"
                  >
                    <FormattedMessage id={item.labelId} defaultMessage={item.defaultLabel} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {index < footerItems.length - 1 && (
              <div className="h-4 w-[1px] bg-slate-800/80 mx-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>
    </footer>
  );
}