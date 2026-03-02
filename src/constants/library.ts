export const DOWNLOAD_STATUS = {
  IDLE: 'idle',
  QUEUED: 'queued',
  DOWNLOADING: 'downloading',
  DONE: 'done',
  PAUSED: 'paused',
  ERROR: 'error',
  UPDATING: 'updating',
} as const;

export const LIBRARY_TABS = {
  ALL: 'all',
  RECENT: 'recent',
  BOOKMARKS: 'bookmarks',
  DOWNLOADS: 'downloads',
} as const;
