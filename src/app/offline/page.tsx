import Image from 'next/image';

import OfflinePlayer from './offline-player';
import OfflineRetryButton from './retry-button';

export const metadata = {
  title: 'Offline — Open Tarteel',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <Image
        src="/images/192x192.png"
        alt="Open Tarteel"
        width={80}
        height={80}
        unoptimized
        className="mb-6 opacity-80"
      />

      <h1 className="mb-2 text-2xl font-bold">لا يوجد اتصال بالإنترنت</h1>
      <p className="mb-1 text-lg text-gray-500 dark:text-gray-400">
        You are currently offline
      </p>
      <p className="mb-6 max-w-sm text-sm text-gray-400 dark:text-gray-500">
        تحقق من اتصالك بالإنترنت وحاول مرة أخرى. المحتوى الذي تم تنزيله مسبقاً
        لا يزال متاحاً.
      </p>

      <OfflinePlayer />
      <OfflineRetryButton />
    </div>
  );
}
