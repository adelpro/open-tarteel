import { cn } from '@/utils';
type Props = {
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
export default function RiwayaFilterItem({
  active,
  className,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        `rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200`,
        {
          'bg-gradient-to-r from-brand-CTA-blue-600 to-brand-CTA-blue-500 text-white shadow-lg shadow-brand-CTA-blue-500/25':
            active,
          'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600':
            !active,
        },
        className
      )}
    />
  );
}
