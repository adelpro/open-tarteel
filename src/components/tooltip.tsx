'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

/** How long a label stays on screen after it is triggered. */
export const TOOLTIP_HIDE_DELAY_MS = 2000;

export default function Tooltip({
  content,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearHideTimer();
    setVisible(false);
  }, [clearHideTimer]);

  const show = useCallback(() => {
    clearHideTimer();
    setVisible(true);
    // Hover and focus can both keep a CSS-only tooltip on screen indefinitely
    // after a click, especially on touch devices. Schedule the dismissal so
    // the label always goes away.
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setVisible(false);
    }, TOOLTIP_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  return (
    <div
      className={cn('relative', className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 block w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 transform whitespace-normal break-words rounded bg-gray-800 px-2 py-1 text-center text-xs text-white"
        >
          {content}
        </span>
      ) : null}
    </div>
  );
}
