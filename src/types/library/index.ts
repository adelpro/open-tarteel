export type TrackFlagsType = {
  isDone: boolean;
  isDownloading: boolean;
  isPaused: boolean;
  isError: boolean;
  isIdle: boolean;
  isUpdating: boolean;
  hasPartial: boolean;
  canResume: boolean;
};
export interface SizeEstimate {
  totalSize: number;
  alreadyDownloaded: number;
  loading: boolean;
  error: boolean;
}
