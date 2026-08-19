import Link from 'next/link';
import React from 'react';

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const FooterLink = ({ href, children, onClick }: FooterLinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-400 opacity-80 whitespace-nowrap transition-all duration-200  focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-400  sm:flex-row sm:gap-2"
    >
      {children}
    </Link>
  );
};