import Image from 'next/image';
import { useIntl } from 'react-intl';

import Tooltip from '@/components/tooltip';
import { ICON_SIZE } from '@/constants';
import type { ButtonConfig } from '@/types';
import { cn } from '@/utils';

export function isStaticImage(
  source: ButtonConfig['src']
): source is ButtonConfig['src'] {
  return typeof source === 'object' && 'src' in source;
}
export default function ControlButton({
  id,
  defaultMessage,
  src,
  onClick,
  extraClass,
  icon: Icon,
  formatMessageOptions,
  disabled = false,
  iconHight = ICON_SIZE,
  iconWidth = ICON_SIZE,
}: Readonly<ButtonConfig>) {
  const { formatMessage } = useIntl();
  const tooltipLabel = formatMessage(
    { id, defaultMessage },
    formatMessageOptions
  );

  return (
    <Tooltip content={tooltipLabel}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded text-player-stroke',
          extraClass,
          {
            'cursor-not-allowed': disabled,
            'hover:bg-gray-200 dark:hover:bg-gray-700': !disabled,
          }
        )}
        aria-label={tooltipLabel}
      >
        {!!isStaticImage(src) && src && (
          <Image
            src={src}
            alt={tooltipLabel}
            width={iconHight}
            height={iconWidth}
          />
        )}
        {Icon && <Icon />}
      </button>
    </Tooltip>
  );
}
