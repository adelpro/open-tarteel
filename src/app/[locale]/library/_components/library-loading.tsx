import { Loader2 } from 'lucide-react';

export function LibraryLoading() {
  return (
    <div className="flex w-full animate-pulse flex-col items-center gap-4 p-4">
      <Loader2 className="animate-spin" />
      <span dir="ltr">Loading library...</span>
    </div>
  );
}
