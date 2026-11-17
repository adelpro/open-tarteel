'use client';

import { ReactNode, useId } from 'react';

import { cn } from '@/utils';

/**
 * Tarteel stand-ins for the Tilawa primitives the account components used
 * (`Field`, `Input`, `TextArea`, `Spinner`), drawn with the settings page's
 * tokens so the Account group matches the groups around it.
 */

export const card = 'rounded-[12px] border border-border p-3';
export const cardTitle = 'text-[15px] font-bold text-ink';
export const note = 'text-[13px] leading-5 text-ink-muted';
export const input =
  'min-h-11 w-full rounded-[10px] border border-border bg-surface px-3 text-[15px] text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
export const primaryButton =
  'flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-3 py-2 text-[14px] font-bold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-45';
export const secondaryButton =
  'min-h-11 w-full rounded-[10px] border border-border px-3 py-2 text-[14px] text-ink transition-colors hover:bg-surface-sunken';
export const quietButton =
  'min-h-11 w-full rounded-[10px] px-3 py-2 text-[14px] text-ink-muted transition-colors hover:text-ink';
export const chip =
  'rounded-full border px-3 py-2 text-[14px] transition-colors duration-120';
export const chipOn = 'border-primary bg-primary font-bold text-on-primary';
export const chipOff = 'border-border text-ink hover:bg-surface-sunken';

/** A labelled control: the label is a real `<label>`, wired by id. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[13px] font-bold text-ink">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

export function Spinner({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0 animate-spin', className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
