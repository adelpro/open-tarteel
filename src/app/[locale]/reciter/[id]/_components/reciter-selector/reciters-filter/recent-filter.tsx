import { MdHistory } from 'react-icons/md';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useRecitersFilter } from '@/hooks/reciters';

export default function RecentFilter() {
  const { showRecentOnly, setShowRecentOnly } = useRecitersFilter();
  const { formatMessage } = useIntl();

  const label = formatMessage(t('filter.RecentPlayed'));

  return (
    <button
      aria-label={label}
      title={label}
      onClick={() => setShowRecentOnly(!showRecentOnly)}
      className={`rounded-full p-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/50 ${
        showRecentOnly
          ? 'bg-brand-CTA-blue-50 dark:bg-brand-CTA-blue-900/30 dark:text-brand-CTA-blue-400 text-brand-CTA-blue-600'
          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <MdHistory className="size-5" />
    </button>
  );
}
