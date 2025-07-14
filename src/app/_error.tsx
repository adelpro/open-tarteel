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

  const content = error.digest;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full">
        <div className="flex min-h-screen w-full max-w-md items-center justify-center bg-gray-100">
          <div className="mx-auto flex w-full max-w-md flex-col rounded-lg bg-white px-10 py-8 text-center shadow-lg">
            <Image src={errorSVG} alt="Error" className="m-auto" />
            <h1 className="mb-5 text-3xl font-bold">{title}</h1>
            <p className="mb-8 text-xl">{content}</p>
            <button
              className="mx-2 my-4 w-full rounded-md bg-red-500 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-red-600 focus:outline-none"
              onClick={reset}
            >
              Try again
            </button>
            <Link
              href="/"
              className="mx-2 w-full rounded-md bg-blue-500 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-blue-600"
            >
              Return to the Home page
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
