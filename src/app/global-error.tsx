'use client';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Last-resort error boundary. Unlike `error.tsx`, this file replaces the
 * root layout, so it must render its own <html> and <body> tags.
 */
export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif',
            gap: '1rem',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            The application could not be loaded. Please try again.
          </p>
          {error.digest && (
            <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: '#2563eb',
              border: 0,
              borderRadius: '0.5rem',
              color: '#fff',
              cursor: 'pointer',
              padding: '0.75rem 1.5rem',
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
