'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { useLocalePath } from '@/hooks/use-locale-path';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

/** A next/link that keeps the visitor inside the current URL locale. */
export default function LocalizedLink({ href, ...props }: Props) {
  const localePath = useLocalePath();
  return <Link href={localePath(href)} {...props} />;
}
