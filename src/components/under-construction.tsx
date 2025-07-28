'use client';
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { hideUnderConstructionAtom } from '@/jotai/atom';

const UnderConstruction: React.FC = () => {
  const [hideUnderConstructionValue, setHideUnderconstructionValue] = useAtom(
    hideUnderConstructionAtom
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if not hidden before
    if (!hideUnderConstructionValue) {
      setVisible(true);
    }
  }, [hideUnderConstructionValue]);

  const handleClose = () => {
    setVisible(false);
    // If user checked "Do not show again", persist it
    if (hideUnderConstructionValue) {
      // Already persisted by checkbox
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed right-6 top-6 z-50 flex max-w-xs flex-col gap-2 rounded border border-yellow-400 bg-yellow-100 p-2 text-yellow-800 shadow-lg">
      <div className="flex flex-col gap-4 px-10">
        <div className="mb-2">
          <strong>
            🚧{' '}
            <FormattedMessage
              id="underConstruction.title"
              defaultMessage="Under Construction"
            />
          </strong>
          <div className="mt-2">
            <FormattedMessage
              id="underConstruction.message"
              defaultMessage="The app is under development"
            />
          </div>
        </div>
        <label className="mb-2 flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={hideUnderConstructionValue}
            onChange={(event) =>
              setHideUnderconstructionValue(event.target.checked)
            }
          />
          <FormattedMessage
            id="underConstruction.doNotShowAgain"
            defaultMessage="Do not show again"
          />
        </label>
      </div>
      <button
        className="mt-4 self-end rounded bg-yellow-400 px-4 py-1 text-sm font-semibold text-yellow-900 transition hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-600"
        onClick={handleClose}
      >
        <FormattedMessage id="close" defaultMessage="Close" />
      </button>
    </div>
  );
};

export default UnderConstruction;
