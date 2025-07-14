import Image from 'next/image';
import React, { ReactNode, useLayoutEffect, useRef } from 'react';

import close from '@/svgs/close.svg';
import { cn } from '@/utils';
type DialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  children: ReactNode;
  hideCloseButton?: boolean;
  className?: string;
};

export default function Dialog({
  isOpen,
  setIsOpen,
  hideCloseButton = false,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useLayoutEffect(() => {
    if (isOpen && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          setIsOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      }}
      className={cn(
        'top-50 left-50 -translate-x-50 -translate-y-50 fixed z-10 mx-auto w-[98%] max-w-xl origin-top animate-slideInWithFade overflow-auto rounded-xl backdrop:bg-zinc-800/50 dark:backdrop:bg-zinc-200/50',
        className
      )}
    >
      <main className="w-full rounded-xl bg-background p-2 pr-5 text-foreground">
        {!hideCloseButton && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="transition-transform duration-200 hover:scale-110"
            >
              <Image src={close} alt="close" width={24} height={24} />
            </button>
          </div>
        )}
        {children}
      </main>
    </dialog>
  );
}
