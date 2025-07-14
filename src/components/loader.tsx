import React from 'react';

import { cn } from '@/utils';

type LoaderProps = {
  message?: string;
  size?: number;
  color?: string;
  className?: string;
  rightIcon?: boolean;
  textClassName?: string;
};

const Loader: React.FC<LoaderProps> = ({
  message = '',
  size = 24,
  color = 'currentColor',
  className = '',
  rightIcon = false,
  textClassName = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'm-5 flex flex-row items-center justify-center gap-2',
        className,
        rightIcon && 'flex-row-reverse'
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        style={{ color }}
      >
        <g stroke="currentColor" strokeWidth="1">
          <circle
            cx="12"
            cy="12"
            r="9.5"
            fill="none"
            strokeLinecap="round"
            strokeWidth="3"
          >
            <animate
              attributeName="stroke-dasharray"
              calcMode="spline"
              dur="1.5s"
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
              keyTimes="0;0.475;0.95;1"
              repeatCount="indefinite"
              values="0 150;42 150;42 150;42 150"
            />
            <animate
              attributeName="stroke-dashoffset"
              calcMode="spline"
              dur="1.5s"
              keySplines="0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1"
              keyTimes="0;0.475;0.95;1"
              repeatCount="indefinite"
              values="0;-16;-59;-59"
            />
          </circle>
          <animateTransform
            attributeName="transform"
            dur="2s"
            repeatCount="indefinite"
            type="rotate"
            values="0 12 12;360 12 12"
          />
        </g>
      </svg>
      {message && <p className={textClassName}>{message}</p>}
    </div>
  );
};

export default Loader;
