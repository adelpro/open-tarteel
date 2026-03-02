import React, { HTMLAttributes } from 'react';

import { cn } from '@/utils';

type BadgeWrapperProps = HTMLAttributes<HTMLDivElement> & {
  show?: boolean;
  badgeContent?: React.ReactNode;
  badgeClassName?: string;
};

export function BadgeWrapper({
  show = false,
  badgeContent,
  badgeClassName,
  ...divProps
}: BadgeWrapperProps) {
  return (
    <div className="relative" {...divProps}>
      {divProps.children}
      {show && badgeContent && (
        <span
          className={cn(
            'absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white',
            badgeClassName
          )}
        >
          {badgeContent}
        </span>
      )}
    </div>
  );
}
