import { DOWNLOAD_STATUS, SW_EVENTS } from '@/constants';
import type { Track } from '@/types';
export type DownloadStatus =
  (typeof DOWNLOAD_STATUS)[keyof typeof DOWNLOAD_STATUS];

export type DownloadTask = {
  id: string;
  url: string;
  progress: number;
  status: DownloadStatus;
};

// ── Full track metadata sent to SW on download/resume ────────────────────────
// SW persists this so metadata survives hard reload
export interface SWTrackMeta {
  id: Track['id'];
  url: string;
  reciterId: string;
  moshafId: string;
  surahId: string;
  link: string;
  reciterName: string;
  moshafName: string;
  surahName: string;
  surahNameEn: string;
  duration: number;
  addedAt: number;
}

// ── Individual message payloads ───────────────────────────────────────────────

export interface SWPingMessage {
  type: typeof SW_EVENTS.PING;
}

export interface SWDownloadTrackMessage extends SWTrackMeta {
  type: typeof SW_EVENTS.DOWNLOAD_TRACK;
}

export interface SWResumeDownloadMessage extends SWTrackMeta {
  type: typeof SW_EVENTS.RESUME_DOWNLOAD;
}

export interface SWPauseDownloadMessage {
  type: typeof SW_EVENTS.PAUSE_DOWNLOAD;
  id: Track['id'];
}

export interface SWCancelDownloadMessage {
  type: typeof SW_EVENTS.CANCEL_DOWNLOAD;
  id: Track['id'];
}

export interface SWClearAudioMessage {
  type: typeof SW_EVENTS.CLEAR_AUDIO;
  id: Track['id'];
}

export interface SWClearTrackMessage {
  type: typeof SW_EVENTS.CLEAR_TRACK;
  id: Track['id'];
}

export interface SWEstimateSizeMessage {
  type: typeof SW_EVENTS.ESTIMATE_SIZE;
  id: Track['id'];
  url: string;
}

export interface SWGetStorageStatsMessage {
  type: typeof SW_EVENTS.GET_STORAGE_STATS;
}

export interface SWClearAllTracksMessage {
  type: typeof SW_EVENTS.CLEAR_ALL_TRACKS;
}

// ── Union of all outbound messages (client → SW) ─────────────────────────────
export type SWMessage =
  | SWPingMessage
  | SWDownloadTrackMessage
  | SWResumeDownloadMessage
  | SWPauseDownloadMessage
  | SWCancelDownloadMessage
  | SWClearAudioMessage
  | SWClearTrackMessage
  | SWEstimateSizeMessage
  | SWGetStorageStatsMessage
  | SWClearAllTracksMessage;

// ── SW → client response payloads ────────────────────────────────────────────

export interface SWProgressResponse {
  type: typeof SW_EVENTS.DOWNLOAD_PROGRESS;
  progress: number;
  speed: number;
  downloadedBytes: number;
  totalBytes: number;
}

export interface SWSuccessResponse {
  success: true;
}

export interface SWFailureResponse {
  success: false;
  error: string;
}

export interface SWPausedResponse {
  paused: true;
}

export interface SWCanceledResponse {
  canceled: true;
}

export interface SWClearedResponse {
  cleared: true;
}

export interface SWSizeResultResponse {
  type: typeof SW_EVENTS.SIZE_RESULT;
  totalSize: number;
  alreadyDownloaded: number;
  error?: boolean;
}

export interface SWStorageStatsResponse {
  totalBytes: number;
  trackCount: number;
}

export interface SWPongResponse {
  type: typeof SW_EVENTS.PONG;
}

// ── Union of all inbound messages (SW → client) ───────────────────────────────
export type SWResponse =
  | SWProgressResponse
  | SWSuccessResponse
  | SWFailureResponse
  | SWPausedResponse
  | SWCanceledResponse
  | SWClearedResponse
  | SWSizeResultResponse
  | SWStorageStatsResponse
  | SWPongResponse;
