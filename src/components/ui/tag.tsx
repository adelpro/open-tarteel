'use client';

import React, { ReactNode } from 'react';

import { cn } from '@/utils';

export type TagVariant = 'filter' | 'static' | 'status' | 'count';
export type TagTone =
  'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'mark';

type TagProps = {
  children: ReactNode;
  variant?: TagVariant;
  tone?: TagTone;
  size?: 'xs' | 'sm' | 'md';
  selected?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  'aria-label'?: string;
};

const sizeStyles = {
  xs: 'min-h-6 px-2.5 text-[12px]',
  sm: 'min-h-8 px-3 text-[12px]',
  md: 'min-h-10 px-4 text-[14px]',
} as const;

const toneText: Record<TagTone, string> = {
  neutral: 'text-ink-muted',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  mark: 'text-mark',
};

/**
 * The only tag/chip primitive in the app. One visual language for filters,
 * labels, statuses, and counts.
 */
export default function Tag({
  children,
  variant = 'static',
  tone = 'neutral',
  size = 'sm',
  selected = false,
  disabled = false,
  icon,
  className,
  onClick,
  title,
  'aria-label': ariaLabel,
}: TagProps) {
  const interactive = variant === 'filter';

  const base =
    'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] text-center font-bold leading-5 transition-colors duration-120';

  const variantStyles = (() => {
    if (variant === 'filter') {
      return cn(
        "relative border after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
        selected
          ? 'border-primary-line bg-primary-soft text-primary'
          : 'border-border bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink',
        disabled && 'cursor-not-allowed opacity-50'
      );
    }
    if (variant === 'static') {
      return cn('bg-surface-sunken', toneText[tone]);
    }
    if (variant === 'status') {
      return cn('border-border border bg-transparent', toneText[tone]);
    }
    return 'text-ink-muted font-normal tabular-nums';
  })();

  const content = (
    <>
      {icon ? (
        <span aria-hidden="true" className="flex shrink-0 items-center">
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={ariaLabel}
        title={title}
        className={cn(base, sizeStyles[size], variantStyles, className)}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      title={title}
      aria-label={ariaLabel}
      className={cn(
        base,
        variant === 'count' ? 'h-auto px-0 text-[12px]' : sizeStyles[size],
        variantStyles,
        className
      )}
    >
      {content}
    </span>
  );
}
