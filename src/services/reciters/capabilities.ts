import type { Moshaf } from '@/types';
import { LinkSource, Riwaya } from '@/types';

import { FOLLOW_ALONG_V4_RECITER_IDS } from './follow-along-v4-ids.generated';

export { FOLLOW_ALONG_V4_RECITER_IDS } from './follow-along-v4-ids.generated';

export type TimingLevel = 'none' | 'ayah' | 'word' | 'letter' | 'phoneme';

export type ProviderCapabilities = {
  id: LinkSource;
  label: { ar: string; en: string };
  beta: boolean;
  timing: TimingLevel;
  timingCoverage: 'all' | 'partial' | 'none';
  /** Whether the app's range/tahfeez engine supports this provider today. */
  timingIntegration: 'implemented' | 'planned';
  names: 'ar' | 'ar+en';
  riwayah: { multiple: boolean; qiraah: boolean };
  audioTiers: Array<'original' | 'mp3_64' | 'opus_48'>;
  wordAudio: boolean;
  auth: 'none' | 'optional-key' | 'oauth2';
  cors: 'open' | 'restricted';
  download: boolean;
  rateLimit?: 'paced' | 'normal';
  docsUrl: string;
  verifiedAt: string;
};

const VERIFIED_AT = '2026-11-05';

export const PROVIDER_CAPABILITIES: Record<LinkSource, ProviderCapabilities> = {
  [LinkSource.MP3QURAN]: {
    id: LinkSource.MP3QURAN,
    label: { ar: 'MP3 Quran', en: 'MP3 Quran' },
    beta: false,
    // https://www.mp3quran.net/eng/timing-api, 115 timing reads for 299 moshafs.
    timing: 'ayah',
    timingCoverage: 'partial',
    timingIntegration: 'implemented',
    names: 'ar+en',
    riwayah: { multiple: true, qiraah: false },
    audioTiers: ['original'],
    wordAudio: false,
    auth: 'none',
    cors: 'open',
    download: true,
    docsUrl: 'https://www.mp3quran.net/eng/timing-api',
    verifiedAt: VERIFIED_AT,
  },
  [LinkSource.ITQAN]: {
    id: LinkSource.ITQAN,
    label: { ar: 'إتقان', en: 'Itqan' },
    beta: false,
    // https://docs.cms.itqan.dev/docs/guides/recitations-ayah-timings/
    // Timings exist per surah, and some recitations omit them entirely.
    timing: 'ayah',
    timingCoverage: 'partial',
    timingIntegration: 'implemented',
    names: 'ar+en',
    riwayah: { multiple: true, qiraah: true },
    audioTiers: ['original'],
    wordAudio: false,
    auth: 'optional-key',
    cors: 'restricted',
    download: false,
    docsUrl: 'https://docs.cms.itqan.dev/docs/reference/api/',
    verifiedAt: VERIFIED_AT,
  },
  [LinkSource.QURANAI]: {
    id: LinkSource.QURANAI,
    label: { ar: 'قرآني', en: 'Qurani.ai' },
    beta: false,
    // `includeTimings=true` returns per-ayah start/end/duration on each ayah.
    timing: 'ayah',
    timingCoverage: 'all',
    timingIntegration: 'implemented',
    names: 'ar+en',
    riwayah: { multiple: true, qiraah: false },
    audioTiers: ['original'],
    wordAudio: true,
    auth: 'none',
    cors: 'open',
    download: true,
    docsUrl: 'https://qurani.ai/en/docs/1-general-apis',
    verifiedAt: VERIFIED_AT,
  },
  [LinkSource.QURAN_FOUNDATION]: {
    id: LinkSource.QURAN_FOUNDATION,
    label: { ar: 'مؤسسة القرآن', en: 'Quran Foundation' },
    beta: false,
    // https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/audio-reciter-timestamp/
    timing: 'word',
    timingCoverage: 'partial',
    timingIntegration: 'implemented',
    names: 'ar+en',
    riwayah: { multiple: true, qiraah: false },
    audioTiers: ['original'],
    wordAudio: true,
    auth: 'oauth2',
    cors: 'open',
    download: true,
    rateLimit: 'paced',
    docsUrl: 'https://api-docs.quran.foundation/',
    verifiedAt: VERIFIED_AT,
  },
  [LinkSource.MP3QURAN_V4]: {
    id: LinkSource.MP3QURAN_V4,
    label: { ar: 'MP3 Quran v4', en: 'MP3 Quran v4' },
    beta: true,
    timing: 'word',
    timingCoverage: 'partial',
    timingIntegration: 'implemented',
    names: 'ar+en',
    riwayah: { multiple: true, qiraah: true },
    audioTiers: ['original', 'mp3_64', 'opus_48'],
    wordAudio: true,
    auth: 'none',
    cors: 'open',
    download: true,
    docsUrl: 'https://docs-staging.mp3quran.net',
    verifiedAt: '2026-11-06',
  },
};

export const getCapabilities = (source: LinkSource): ProviderCapabilities =>
  PROVIDER_CAPABILITIES[source];

export const hasTiming = (source: LinkSource): boolean =>
  getCapabilities(source).timing !== 'none';

/** Range/tahfeez is only safe where the app has implemented the timing call. */
export const canUseRangeMode = (
  source?: LinkSource | null,
  moshaf?: Moshaf | null
): boolean =>
  Boolean(
    source &&
    moshaf?.hasTimings !== false &&
    getCapabilities(source).timingIntegration === 'implemented'
  );

export const canDownload = (source?: LinkSource | null): boolean =>
  Boolean(source && getCapabilities(source).download);

/**
 * Recitations excluded from follow-along even though the provider numbers
 * words. Quran Foundation id 168 repeats every phrase for children: 95.94% of
 * words timed, 5,516 malformed rows, 51 verses with no timing at all.
 */
export const FOLLOW_ALONG_EXCLUDED_IDS: ReadonlySet<string> = new Set([
  'quran.foundation:168',
]);

/**
 * Whether the follow-along mode can promise a word for every position.
 *
 * Word timings are the only data that can drive a per-word highlight, so the
 * provider has to publish them; Hafs is the only riwayah that has them today.
 * Audio analysability is checked separately by the UI
 * (`canUseAudioAnalyser`), because the text line and the graph have different
 * requirements.
 */
export type FollowAlongBlock =
  'offline' | 'provider' | 'not-hafs' | 'no-timings' | 'unaudited' | null;

/**
 * Why the mode cannot run, or null when it can. Ordered so the most basic
 * reason wins: connectivity, then the provider, then the riwayah, then the
 * specific recording.
 */
export const followAlongBlockReason = (
  source?: LinkSource | null,
  moshaf?: Pick<Moshaf, 'id' | 'riwaya' | 'hasTimings'> | null,
  online = true
): FollowAlongBlock => {
  if (!online) return 'offline';
  if (!source || !moshaf) return 'provider';
  if (getCapabilities(source).timing !== 'word') return 'provider';
  if (moshaf.riwaya !== Riwaya.Hafs) return 'not-hafs';
  if (moshaf.hasTimings === false) return 'no-timings';
  if (FOLLOW_ALONG_EXCLUDED_IDS.has(`${source}:${moshaf.id}`)) {
    return 'unaudited';
  }
  if (
    source === LinkSource.MP3QURAN_V4 &&
    !FOLLOW_ALONG_V4_RECITER_IDS.has(moshaf.id)
  ) {
    return 'unaudited';
  }
  return null;
};

export const canUseFollowAlong = (
  source?: LinkSource | null,
  moshaf?: Pick<Moshaf, 'id' | 'riwaya' | 'hasTimings'> | null
): boolean => followAlongBlockReason(source, moshaf, true) === null;
