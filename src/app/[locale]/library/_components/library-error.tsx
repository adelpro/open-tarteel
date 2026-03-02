export function LibraryError({
  message,
  onRetry,
}: Readonly<{
  message: string;
  onRetry: () => void;
}>) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 text-red-500">
      <p>{message}</p>
      <button onClick={onRetry} className="text-sm underline">
        Retry
      </button>
    </div>
  );
}
