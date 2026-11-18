export default function SimpleSkeleton() {
  return (
    <div className="flex w-full flex-col items-start justify-center gap-2">
      <div className="h-3 w-4/6 rounded-full bg-surface-sunken" />
      <div className="h-3 w-full max-w-md rounded-full bg-surface-sunken" />
      <div className="h-3 w-5/6 max-w-md rounded-full bg-surface-sunken" />
    </div>
  );
}
