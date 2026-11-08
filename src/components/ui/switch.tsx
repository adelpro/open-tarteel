'use client';

import React from 'react';

import { cn } from '@/utils';

type Props = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** 44×26 switch with a logical-position thumb (works in RTL). */
export default function Switch({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex h-[26px] w-11 shrink-0 items-center rounded-full border border-border-strong p-[2px] transition-colors duration-180',
        checked && 'border-primary bg-primary',
        !checked && 'bg-surface-sunken',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-5 w-5 rounded-full bg-white transition-[margin] duration-180',
          checked ? 'ms-auto' : 'ms-0'
        )}
      />
    </button>
  );
}
