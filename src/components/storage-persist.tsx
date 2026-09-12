'use client';

import { useEffect } from 'react';

export default function StoragePersist() {
  useEffect(() => {
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  return null;
}
