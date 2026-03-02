'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils';

type IconButtonProps = {
  onClick: () => void;
  label: string;
  variant?: 'default' | 'success' | 'danger' | 'primary';
  children: React.ReactNode;
};
export function IconButton({
  onClick,
  label,
  variant = 'default',
  children,
}: Readonly<IconButtonProps>) {
  const variantClasses = {
    default:
      'bg-secondary text-secondary-foreground hover:bg-muted-foreground/10',
    success: 'bg-success/10 text-success hover:bg-success/20',
    danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    primary: 'bg-primary/10 text-primary hover:bg-primary/20',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            variantClasses[variant]
          )}
          aria-label={label}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
