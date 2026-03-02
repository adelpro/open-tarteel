'use client';

import Link from 'next/link';
import { useIntl } from 'react-intl';

import { getMessageConfig as t } from '@/helpers';
import { useRecentRecitersData } from '@/hooks/recent-reciters';
import { useActiveReciter } from '@/hooks/use-active-reciter';

export default function CtaButton() {
  const { latestRecentReciter } = useRecentRecitersData();
  const { reciter: r } = useActiveReciter();
  const { formatMessage, locale } = useIntl();
  // get last reciter or last selected
  const reciter = latestRecentReciter || r;

  const href = reciter
    ? `${locale}/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`
    : `${locale}/reciter`;

  return (
    <Link
      href={href}
      className="dark:via-brand-CTA-blue-400 dark:to-brand-CTA-blue-300 group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-CTA-blue-600 via-brand-CTA-blue-500 to-brand-CTA-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-brand-CTA-blue-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500/40 active:scale-95 dark:from-brand-CTA-blue-500"
    >
      {formatMessage(t(reciter ? 'cta.continue' : 'cta.select'))}
    </Link>
  );
}
