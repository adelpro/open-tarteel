'use client';

import React, { ReactNode } from 'react';

import { cn } from '@/utils';

type Option<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label: string;
  className?: string;
};

/** Segmented control: 2–3 mutually exclusive choices with a 44px row. */
export default function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex w-full gap-1 rounded-control bg-surface-sunken p-1',
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-[8px] px-2 text-[13px] font-bold transition-colors duration-120',
              active
                ? 'border border-border bg-surface text-ink'
                : 'border border-transparent text-ink-muted hover:text-ink',
              option.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {option.icon ? (
              <span aria-hidden="true" className="flex items-center">
                {option.icon}
              </span>
            ) : null}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
