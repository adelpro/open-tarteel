'use client';
import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/utils';

type Props = ComponentPropsWithoutRef<'main'>;
export default function MainLayout({ className, ...props }: Readonly<Props>) {
  return (
    <main
      {...props}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto pt-[var(--header-height)]',
        className
      )}
    />
  );
}
