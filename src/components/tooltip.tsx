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
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {content}
      </span>
    </div>
  );
}
