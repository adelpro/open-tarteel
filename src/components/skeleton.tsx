import Skeleton from 'react-loading-skeleton';

export default function SkeletonLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton height={40} width={300} />
      <Skeleton height={20} count={3} />
      <Skeleton height={200} />
    </div>
  );
}
