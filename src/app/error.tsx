'use client';

import Image from 'next/image';
import Link from 'next/link';

import errorSVG from '@/svgs/error.svg';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full">
        <div className="flex min-h-screen w-full max-w-md items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="mx-auto flex w-full max-w-md flex-col rounded-lg bg-white px-10 py-8 text-center shadow-lg dark:bg-gray-800">
            <Image src={errorSVG} alt="Error" className="m-auto" />
            <h1 className="mb-5 text-3xl font-bold text-gray-900 dark:text-white">
              {error.name || 'Error'}
            </h1>
            <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Error ID: {error.digest}
              </p>
            )}
            <button
              className="mx-2 my-4 w-full rounded-md bg-red-500 py-2 text-white transition-colors duration-300 ease-in-out hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={reset}
            >
              Try again
            </button>
            <Link
              href="/"
              className="hover:from-brand-CTA-blue-700 mx-2 w-full rounded-md bg-gradient-to-r from-brand-CTA-blue-600 to-brand-CTA-blue-500 py-2 text-white transition-colors duration-300 ease-in-out hover:to-brand-CTA-blue-600 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 focus:ring-offset-2"
            >
              Return to the Home page
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
