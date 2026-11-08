'use client';

import React, { ReactNode } from 'react';

import { cn } from '@/utils';

type Props = {
  label: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  htmlFor?: string;
};

/** Settings row: label + description on the start side, control on the end. */
export default function Row({
  label,
  description,
  children,
  className,
  htmlFor,
}: Props) {
  const labelNode = (
    <p
      id={htmlFor ? `${htmlFor}-label` : undefined}
      className="text-[15px] font-bold text-ink"
    >
      {label}
    </p>
  );

  return (
    <div
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 px-4 py-3',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="cursor-pointer">
            {labelNode}
          </label>
        ) : (
          labelNode
        )}
        {description ? (
          <div className="text-[13px] leading-5 text-ink-muted">
            {description}
          </div>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
