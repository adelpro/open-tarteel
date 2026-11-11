'use client';

import React from 'react';

import { cn } from '@/utils';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

export default function Tooltip({
  content,
  children,
  className,
}: TooltipProps) {
  return (
    <div className={cn('group relative', className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 transform whitespace-normal break-words rounded bg-gray-800 px-2 py-1 text-center text-xs text-white group-focus-within:block group-hover:block">
        {content}
      </span>
    </div>
  );
}
