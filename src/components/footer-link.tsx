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
      className="group flex flex-row items-center justify-center gap-1.5 rounded-md px-1 text-xs font-medium text-zinc-500 opacity-70 transition-all duration-200 hover:-translate-y-0.5 hover:text-zinc-700 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:text-slate-400 dark:hover:text-slate-200"
    >
      {children}
    </Link>
  );
};
