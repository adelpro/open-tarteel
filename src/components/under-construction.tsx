import Image from 'next/image';

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
      <p>جاري تطوير التطبيق</p>
    </div>
  );
}
