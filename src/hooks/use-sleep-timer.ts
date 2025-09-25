import { useEffect, useState } from 'react';

export const useSleepTimer = (togglePlayPause: () => void) => {
  const [sleepTimerId, setSleepTimerId] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Real-time countdown (for accurate pause)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (remainingTime !== null && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((previous) =>
          previous && previous > 1 ? previous - 1 : null
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remainingTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sleepTimerId) clearTimeout(sleepTimerId);
    };
  }, [sleepTimerId]);

  const setSleepTimer = (minutes: number | 'end') => {
    if (sleepTimerId) clearTimeout(sleepTimerId);
    const duration = minutes === 'end' ? 120 * 60 : minutes * 60;
    const id = setTimeout(() => {
      togglePlayPause();
      setSleepTimerId(null);
      setRemainingTime(null);
    }, duration * 1000);
    setSleepTimerId(id);
    setRemainingTime(duration);
  };

  const clearSleepTimer = () => {
    if (sleepTimerId) clearTimeout(sleepTimerId);
    setSleepTimerId(null);
    setRemainingTime(null);
  };

  return {
    remainingTime,
    setSleepTimer,
    clearSleepTimer,
  };
};
