import { useEffect, useState } from 'react';

import type { Reciter } from '@/types';
import { getAllReciters } from '@/utils/api';

export function useReciters() {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllReciters();
        setReciters(data);
      } catch (error_) {
        setError('فشل في تحميل القراء. يرجى المحاولة مرة أخرى.');
        console.error('Error loading reciters:', error_);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { reciters, loading, error };
}
