import { SupportedLanguage } from '@/services';
import { LocaleType } from '@/types';

export const getLanguage = (locale?: LocaleType): SupportedLanguage =>
  locale === 'en' ? 'eng' : 'ar';
