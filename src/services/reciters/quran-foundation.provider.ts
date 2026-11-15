import type { TahfeezSegment } from '@/types/tahfeez';

import { qfFetch } from './quran-foundation.client';

/** Raw word segments, shape varies by endpoint; parsed by the caller. */
export interface QfWordTimestamp {
  verse_key: string;
  segments?: unknown;
}

export interface QfChapterReciter {
  id: number;
  name: string;
}

export type QfTimestampSegment = [
  wordIndex: number,
  startMs: number,
  endMs: number,
];

export interface QfVerseTimestamp {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  duration: number;
  segments?: QfTimestampSegment[] | null;
}

export interface QfChapterAudioFileResponse {
  audio_file: {
    id: number;
    chapter_id: number;
    audio_url: string;
    timestamps?: QfVerseTimestamp[];
  };
}

export async function getChapterReciters(): Promise<QfChapterReciter[]> {
  const response = await qfFetch('/content/api/v4/resources/chapter_reciters');
  if (!response.ok)
    throw new Error(`chapter_reciters failed: ${response.status}`);
  const data: { reciters: QfChapterReciter[] } = await response.json();
  return data.reciters;
}

export async function getChapterAudioFile(
  chapterReciterId: number,
  chapterNumber: number
): Promise<QfChapterAudioFileResponse['audio_file']> {
  const response = await qfFetch(
    `/content/api/v4/chapter_recitations/${chapterReciterId}/${chapterNumber}?segments=true`
  );
  if (!response.ok)
    throw new Error(`chapter_recitations failed: ${response.status}`);
  const data: QfChapterAudioFileResponse = await response.json();
  return data.audio_file;
}

function toSegment(
  t: QfVerseTimestamp,
  surah: number,
  audioSource: string
): TahfeezSegment {
  const [, ayahString] = t.verse_key.split(':');
  return {
    surah,
    ayah: Number(ayahString),
    audioSource,
    startMs: t.timestamp_from,
    endMs: t.timestamp_to, // مش duration، راجع الشرح اللي فات
  };
}

/**
 * بيرجع segments لسورة واحدة، أو null لو الريسايتر ده معندوش توقيت
 * (زي ما شرحنا: timestamps مش مضمونة حتى مع quran.foundation نفسه)
 */
export async function getSurahTahfeezSegments(
  chapterReciterId: number,
  chapterNumber: number
): Promise<TahfeezSegment[] | null> {
  const audioFile = await getChapterAudioFile(chapterReciterId, chapterNumber);
  if (!audioFile.timestamps || audioFile.timestamps.length === 0) {
    return null; // fallback لـ qurani.ai هيتفعل من هنا
  }
  return audioFile.timestamps.map((t) =>
    toSegment(t, chapterNumber, audioFile.audio_url)
  );
}

/**
 * Raw per-verse word segments, untouched. Follow-along needs the `segments`
 * arrays that {@link getSurahTahfeezSegments} discards when it flattens to
 * ayah bounds; parsing and validation happen in `parseQuranFoundationWords`.
 */
export async function getSurahWordTimestamps(
  chapterReciterId: number,
  chapterNumber: number
): Promise<QfWordTimestamp[]> {
  const audioFile = await getChapterAudioFile(chapterReciterId, chapterNumber);
  return (audioFile.timestamps ?? []).map(({ verse_key, segments }) => ({
    verse_key,
    segments,
  }));
}
