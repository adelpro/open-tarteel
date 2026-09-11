/** Quran Foundation content API types (v4-aligned, verified live against prelive). */

export type QuranFoundationChapterReciter = {
  id: number;
  name: string;
  style?: {
    name?: string;
    translated_name?: { name: string; language_name: string };
  } | null;
  /** Riwaya, e.g. "Hafs" or "Warsh". */
  qirat?: { name?: string; language_name?: string } | null;
  translated_name?: { name: string; language_name: string };
};

export type QuranFoundationChapterRecitersResponse = {
  reciters: QuranFoundationChapterReciter[];
};

/** Word/verse segment timestamps (ms); only verse-level endpoints return them yet. */
export type QuranFoundationSegment = {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  /** Word-level segment data; shape varies by endpoint. */
  segments?: unknown[];
};

export type QuranFoundationAudioFile = {
  id: number;
  chapter_id: number;
  audio_url: string;
  file_size?: number;
  format?: string;
  /** Present only on endpoints that return segments. */
  segments?: QuranFoundationSegment[];
};

export type QuranFoundationChapterAudioResponse = {
  audio_files: QuranFoundationAudioFile[];
};

export type QuranFoundationTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
};
