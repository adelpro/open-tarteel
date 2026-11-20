import React from 'react';

import LocalizedLink from './localized-link';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const FooterLink = ({ href, children, onClick }: FooterLinkProps) => {
  return (
    <LocalizedLink
      href={href}
      onClick={onClick}
      className="focus-ring flex min-h-11 min-w-11 flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-1 py-3 text-[13px] font-bold text-ink-muted transition-colors duration-180 hover:text-ink"
    >
      {children}
    </LocalizedLink>
  );
};
