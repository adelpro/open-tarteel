export default function SimpleSkeleton() {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-2">
      <div className="h-3 w-4/6 animate-pulse rounded-full bg-gray-300" />
      <div className="h-3 w-full max-w-md animate-pulse rounded-full bg-gray-300" />
      <div className="h-3 w-5/6 max-w-md animate-pulse rounded-full bg-gray-300" />
    </div>
  );
}
