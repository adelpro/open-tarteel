'use client';
import { useEffect, useState } from 'react';

import Dialog from './dialog';

const onConfirmActivate = () => globalThis.window.wb.messageSkipWaiting();
const PwaUpdater = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (globalThis.window === undefined || !('wb' in globalThis.window)) {
      return;
    }

    globalThis.window.wb.addEventListener('controlling', () => {
      globalThis.location.reload();
    });

    globalThis.window.wb.addEventListener('waiting', () => setIsOpen(true));
    globalThis.window.wb.register();
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
