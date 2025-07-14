import { TrackType } from './track-type';

export type TorrentInfo = {
  magnetURI: string;
  files: TrackType[];
  downloaded: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  peers: number;
  ready: boolean;
};
