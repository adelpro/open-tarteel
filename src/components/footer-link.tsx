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
      className="group flex min-h-11 flex-row items-center justify-center gap-1.5 rounded-md px-1 py-3 text-[13px] font-medium text-ink-muted transition-all duration-200 hover:-translate-y-0.5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-slate-300 dark:hover:text-slate-100"
    >
      {children}
    </LocalizedLink>
  );
};
