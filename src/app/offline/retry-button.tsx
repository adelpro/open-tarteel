'use client';

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => globalThis.location.reload()}
      className="mt-2 rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 active:bg-sky-800"
    >
      إعادة المحاولة / Retry
    </button>
  );
}
