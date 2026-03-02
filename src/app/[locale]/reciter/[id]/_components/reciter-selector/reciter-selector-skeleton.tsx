export default function ReciterSelectorSkeleton() {
  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-lg items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-white to-gray-100 p-3 shadow-md shadow-gray-300/20 dark:from-gray-700 dark:to-gray-600">
        <span className="h-6 w-40 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
      </div>
    </div>
  );
}
