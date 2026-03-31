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
      className="group flex flex-row items-center justify-center gap-1.5 rounded-md px-1 text-xs font-medium text-zinc-600 transition-all duration-200 hover:-translate-y-0.5 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-slate-300 dark:hover:text-slate-100"
    >
      {children}
    </Link>
  );
};
