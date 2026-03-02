import type { StaticImageData } from 'next/image';

import { MessageKey } from '@/types';

export type BaseButtonConfig = {
  src?: string | StaticImageData;
  id: string;
  defaultMessage: string;
};

export type ButtonConfigMap = {
  [K in MessageKey]?: BaseButtonConfig;
};

export type ButtonConfig = BaseButtonConfig & {
  onClick?: () => void;
  icon?: any;
  disabled?: boolean;
  extraClass?: string;
  formatMessageOptions?: Record<string, any>;
  iconWidth?: number;
  iconHight?: number;
};
