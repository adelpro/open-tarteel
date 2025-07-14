import React from 'react';

import { Riwaya } from '@/types';
import { cn } from '@/utils/cn';

export default function Tags() {
  const [riwaya, setRiwaya] = React.useState<Riwaya>(Riwaya.Hafs);
  return (
    <section className="mt-8 flex w-full max-w-md flex-row justify-center gap-3">
      {Object.values(Riwaya).map((value) => (
        <option key={value} value={value}>
          <span
            className={cn(
              'cursor-pointer rounded-md border border-slate-700 px-10 py-2',
              value === riwaya && 'bg-neutral-200'
            )}
          >
            {value}
          </span>
        </option>
      ))}
    </section>
  );
}
