'use client';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Last-resort error boundary. Unlike `error.tsx`, this file replaces the
 * root layout, so it must render its own <html> and <body> tags.
 */
/**
 * A deploy can leave the service worker holding chunks from the previous build.
 * Clearing the worker and every cache is the only reliable escape from that
 * state, so offer it next to the plain retry.
 */
async function resetApp(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister())
      );
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // reload anyway
  }
  window.location.reload();
}

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
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
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
            <button
              onClick={() => void resetApp()}
              style={{
                background: 'transparent',
                border: '1px solid #94a3b8',
                borderRadius: '0.5rem',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.75rem 1.5rem',
              }}
              type="button"
            >
              Reset and reload
            </button>
          </div>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
            Reset clears the offline cache. Downloads will need to be fetched
            again.
          </p>
        </main>
      </body>
    </html>
  );
}
