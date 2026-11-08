'use client';

import React, { useEffect, useId, useRef } from 'react';
import { MdClose } from 'react-icons/md';

import { cn } from '@/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Bottom sheet on phones, compact centred dialog from `lg`.
 * Native <dialog> gives us the scrim, focus trap, and Escape handling.
 */
export default function ActionSheet({
  open,
  onClose,
  title,
  children,
  className,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      {...({ closedby: 'any' } as const)}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-[520px] rounded-t-[20px] border-t border-border bg-surface p-0 text-ink backdrop:bg-zinc-900/50 lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85dvh] lg:max-w-sm lg:rounded-[16px] lg:border',
        className
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 id={titleId} className="text-[16px] font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-me-2 flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors duration-120 hover:bg-surface-sunken hover:text-ink"
        >
          <MdClose className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto overscroll-contain p-2 pb-[max(12px,env(safe-area-inset-bottom))] lg:max-h-[calc(85dvh-3.5rem)]">
        {children}
      </div>
    </dialog>
  );
}
