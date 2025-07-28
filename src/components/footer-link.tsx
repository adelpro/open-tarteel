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
      className="animate-all flex flex-row items-center justify-center gap-1 text-sm text-gray-700 duration-200 hover:-translate-y-1 hover:scale-105 hover:text-gray-500"
    >
      {children}
    </Link>
  );
};
