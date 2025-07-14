import Image from 'next/image';

import imagePlaceHolderSVG from '@/svgs/imagePlaceHolder.svg';

export default function Skeleton() {
  return (
    <div
      role="status"
      className="m-auto w-full max-w-md animate-pulse rounded border border-gray-200 p-4 shadow dark:border-gray-700 md:p-6"
    >
      <div className="mb-4 flex h-48 items-center justify-center rounded bg-gray-300 dark:bg-gray-700">
        <div className="h-10 w-10 text-gray-200 dark:text-gray-600">
          <Image
            src={imagePlaceHolderSVG}
            alt="image place holder"
            width={200}
            height={200}
            className="mx-auto"
          />
        </div>
      </div>
      <div className="mb-4 h-2.5 w-48 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="mb-2.5 h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </div>
  );
}
