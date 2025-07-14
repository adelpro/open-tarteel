'use client';
import { useEffect, useState } from 'react';

import Dialog from './dialog';

const onConfirmActivate = () => window.wb.messageSkipWaiting();
const PwaUpdater = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('wb' in window)) {
      return;
    }

    window.wb.addEventListener('controlling', () => {
      globalThis.location.reload();
    });

    window.wb.addEventListener('waiting', () => setIsOpen(true));
    window.wb.register();
  }, []);
  //TODO translate to arabic
  return (
    <Dialog isOpen={isOpen} setIsOpen={setIsOpen}>
      <div>Hey, a new version is available! Please click below to update.</div>

      <button onClick={onConfirmActivate}>Reload and update</button>
      <button onClick={() => setIsOpen(false)}>Cancel</button>
    </Dialog>
  );
};

export default PwaUpdater;
