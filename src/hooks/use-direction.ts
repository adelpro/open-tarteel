import { useIntl } from 'react-intl';

export default function useDirection() {
  const { locale } = useIntl();
  const isRTL: boolean = locale === 'ar' ? true : false;
  return { isRTL };
}
