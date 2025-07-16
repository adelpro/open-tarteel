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
        'top-50 left-50 -translate-x-50 -translate-y-50 fixed z-10 mx-auto w-[98%] max-w-4xl origin-top animate-slideInWithFade backdrop:bg-zinc-800/50 dark:backdrop:bg-zinc-200/50',
        className
      )}
    >
      {/* Apply overflow and rounded corners to the main content container */}
      <main className="h-full w-full overflow-hidden rounded-xl bg-background text-foreground">
        <div className="h-full w-full overflow-y-auto pr-5">
          {' '}
          {/* Added pr-5 here for scrollbar space */}
          {!hideCloseButton && (
            <div className="m-2 flex items-center justify-end">
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
          <div className="p-2">
            {' '}
            {/* Added p-2 here for content padding */}
            {children}
          </div>
        </div>
      </main>
    </dialog>
  );
}
