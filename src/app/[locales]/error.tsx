'use client';
import Image from 'next/image';
import Link from 'next/link';

import errorSVG from '@/svgs/error.svg';
type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};
export default function Error({ error, reset }: Props): React.ReactElement {
  const title = `Error - ${error.name}`;
  const content = error.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="mx-auto w-full max-w-md rounded-lg bg-white px-10 py-8 text-center shadow-lg">
        <Image src={errorSVG} alt="Error" className="m-auto" />
        <h1 className="mb-5 text-3xl font-bold">{title}</h1>
        <p className="mb-8 text-xl">{content}</p>
        <button
          className="mx-2 my-4 w-full rounded-md bg-red-500 py-2 text-white hover:bg-red-600"
          onClick={reset}
        >
          Try again
        </button>
        <Link
          href="/"
          className="mx-2 inline-block w-full rounded-md bg-blue-500 py-2 text-center text-white hover:bg-blue-600"
        >
          Return to the Home page
        </Link>
      </div>
    </div>
  );
}
