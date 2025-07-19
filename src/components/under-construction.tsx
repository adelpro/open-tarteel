'use client';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import underconstructionSVG from '@/svgs/underconstruction.svg';

export default function UnderConstruction() {
  return (
    <div className="flex flex-row-reverse items-center justify-center gap-3">
      <Image
        src={underconstructionSVG}
        height={30}
        width={30}
        alt="Underconstruction"
      />
      <p>
        <FormattedMessage
          id="underConstruction"
          defaultMessage="The app is under development"
        />
      </p>
    </div>
  );
}
