import Link from 'next/link';

export const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="animate-all flex flex-row-reverse items-center justify-center gap-1 text-sm text-gray-700 duration-200 hover:-translate-y-1 hover:scale-105 hover:text-gray-500"
    >
      {children}
    </Link>
  );
};
