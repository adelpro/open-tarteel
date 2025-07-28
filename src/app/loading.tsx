import React from 'react';

import Skeleton from '@/components/skeleton';

export default function loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Skeleton />
    </div>
  );
}
