import '../../globals.css';

import type { Metadata } from 'next';

import { RootShell } from '@/components/root-shell';
import { rootMetadata } from '@/lib/seo/root-metadata';
import { rootViewport } from '@/lib/seo/root-viewport';

export const metadata: Metadata = rootMetadata('en');
export const viewport = rootViewport;

export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootShell locale="en">{children}</RootShell>;
}
