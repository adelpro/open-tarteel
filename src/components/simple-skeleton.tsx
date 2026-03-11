import Skeleton from 'react-loading-skeleton';

export default function SimpleSkeleton() {
  return (
    <div
      className={'hover:border-brand-CTA-blue-200 relative w-full rounded-xl'}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 overflow-hidden text-right">
            <Skeleton className="h-[100px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
