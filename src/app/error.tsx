'use client';

import Image from 'next/image';

import LocalizedLink from '@/components/localized-link';
import errorSVG from '@/svgs/error.svg';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props): React.ReactElement {
  const message =
    process.env.NODE_ENV === 'development'
      ? error.message
      : 'Something went wrong. Please try again.';

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-canvas">
      <div className="mx-auto flex w-full max-w-md flex-col rounded-lg bg-surface px-10 py-8 text-center">
        <Image src={errorSVG} alt="Error" className="m-auto" />
        <h1 className="mb-5 text-3xl font-bold text-ink">
          {error.name || 'Error'}
        </h1>
        <p className="mb-8 text-xl text-ink-muted">
          {message}
        </p>
        {error.digest && (
          <p className="mb-4 text-sm text-ink-muted">
            Error ID: {error.digest}
          </p>
        )}
        <button
          className="mx-2 my-4 w-full rounded-md bg-primary py-2 text-on-primary transition-colors duration-180 hover:bg-primary-hover focus-ring"
          onClick={reset}
        >
          Try again
        </button>
        <LocalizedLink
          href="/"
          className="mx-2 w-full rounded-md bg-primary py-2 text-on-primary transition-colors duration-180 hover:bg-primary-hover focus-ring"
        >
          Return to the Home page
        </LocalizedLink>
      </div>
    </div>
  );
}
