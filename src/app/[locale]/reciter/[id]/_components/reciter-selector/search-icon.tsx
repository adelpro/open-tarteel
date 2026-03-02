import Image from 'next/image';

import { ICON_SIZE } from '@/constants';
import { getMessageConfig } from '@/helpers';
import searchSVG from '@/svgs/search.svg';

export default function SearchIcon() {
  const fallback = getMessageConfig('reciter.select');
  return (
    <Image
      src={searchSVG}
      alt={fallback.defaultMessage}
      width={ICON_SIZE}
      height={ICON_SIZE}
      className="text-gray-600/80 transition-colors hover:text-gray-900 dark:text-gray-400/80 dark:hover:text-gray-100"
    />
  );
}
