'use client';

import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

import { cn } from '@/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { asChild = false, className, type = 'button', ...props },
    ref
  ) {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        type={!asChild ? type : undefined}
        className={cn(
          'inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
