import { useIntl } from 'react-intl';

export default function useDirection(): {
  locale: string;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
} {
  const { locale } = useIntl();
  const isRTL: boolean = locale === 'ar';
  return { locale, isRTL, dir: isRTL ? 'rtl' : 'ltr' };
}
