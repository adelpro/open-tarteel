import Image from 'next/image';
import { useIntl } from 'react-intl';

import type { BaseButtonConfig } from '@/types';
import { cn } from '@/utils';

type MenuItemProps = BaseButtonConfig & {
  onClick?: () => void;
  disabled?: boolean;
  extraClass?: string;
  formatMessageOptions?: Record<string, any>;
};

export default function MenuItem({
  id,
  defaultMessage,
  formatMessageOptions,
  src,
  onClick,
  extraClass,
}: Readonly<MenuItemProps>) {
  const { formatMessage } = useIntl();
  const content = formatMessage(
    { id, defaultMessage: defaultMessage },
    formatMessageOptions
  );
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
        extraClass
      )}
    >
      {src && <Image src={src} alt={content} width={16} height={16} />}
      <span>{content}</span>
    </button>
  );
}
