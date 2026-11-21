'use client';

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => globalThis.location.reload()}
      className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition-colors hover:bg-primary-hover"
    >
      إعادة المحاولة / Retry
    </button>
  );
}
