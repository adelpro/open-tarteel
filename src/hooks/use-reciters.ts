'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { selectedReciterAtom } from '@/jotai/atom';
import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';

export function useReciters() {
  const intlLanguage = useIntl().locale;
  const language = intlLanguage === 'en' ? 'en' : 'ar';

  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReciter, setSelectedReciter] = useAtom(selectedReciterAtom);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllReciters(language);
        setReciters(data);

        const oldReciterId = selectedReciter?.id;
        const newSelectedReciter = data.find(
          (item) => item.id === oldReciterId
        );

        // Update only if different or not set
        if (newSelectedReciter && oldReciterId !== newSelectedReciter.id) {
          setSelectedReciter(newSelectedReciter);
        }
      } catch {
        setError('فشل في تحميل القراء. يرجى المحاولة مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }

    load();
    // Removed selectedReciter?.id from deps to avoid loop
  }, [language, selectedReciter?.id, setSelectedReciter]);

  return { reciters, loading, error };
}
