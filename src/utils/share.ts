import { useIntl } from 'react-intl';

import { Reciter } from '@/types';

export function useShareReciter() {
  const { formatMessage } = useIntl();

  async function shareReciter(reciter: Reciter): Promise<void> {
    const url = `https://tarteel.quran.us.kg/reciter/${reciter.id}?moshafId=${reciter.moshaf.id}`;

    const message = formatMessage({
      id: 'share.message',
      defaultMessage: 'Listen to this reciter on Open Tarteel',
    });
    const fallbackMessage = formatMessage({
      id: 'share.fallback',
      defaultMessage: 'Link copied to clipboard!',
    });
    const fallbackError = formatMessage({
      id: 'share.fallback.error',
      defaultMessage: 'Failed to copy link.',
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: reciter.name,
          text: message,
          url,
        });
        return;
      } catch {
        // User canceled or error - ignore
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      alert(fallbackMessage);
    } catch {
      alert(fallbackError);
    }
  }

  return { shareReciter };
}
