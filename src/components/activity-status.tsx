import Link from 'next/link';

import { clientConfig } from '@/utils';

const trackers = [
  {
    url: clientConfig.TRACKER_ONE_URL,
    label: '1 الخادم',
    hover: 'hover:text-blue-500 dark:hover:text-blue-400',
  },
  {
    url: clientConfig.TRACKER_TWO_URL,
    label: 'الخادم 2',
    hover: 'hover:text-green-500 dark:hover:text-green-400',
  },
];

export default function ActivityStatus() {
  return (
    <div className="absolute left-2 top-2 flex gap-2 rounded-md bg-white/70 p-1 shadow-sm backdrop-blur dark:bg-gray-800/70">
      {trackers.map(({ url, label, hover }, index) => (
        <Link
          key={index}
          href={url}
          target="_blank"
          className={`group flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-700 transition-all hover:scale-105 dark:text-gray-200 ${hover}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 32 32"
            aria-hidden="true"
            className="text-current"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 16h6l4-11l6 22l4-11h6"
            />
          </svg>
          <span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
    </div>
  );
}
