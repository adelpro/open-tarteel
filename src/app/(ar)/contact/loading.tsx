import Skeleton from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Skeleton />
    </div>
  );
}
