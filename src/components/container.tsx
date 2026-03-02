'use client';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

type ContainerProps = ComponentPropsWithoutRef<'div'>;

export default function Container({
  className,
  ...props
}: Readonly<ContainerProps>) {
  return (
    <div
      className={cn('container mx-auto h-full px-2 sm:px-8', className)}
      {...props}
    />
  );
}
