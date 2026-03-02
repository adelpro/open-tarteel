export interface LocalizedString {
  ar: string;
  en: string;
  fr?: string; // Future-proofing
}
// ── BaseTrack — minimum the player engine needs ───────────────────────────────
export interface BaseTrack {
  surahId: string;
  link: string;
}

// ── PlayerTrack — what the player UI needs to render ─────────────────────────
// All playlist sources (reciter, library, recent) must satisfy this shape.
export interface PlayerTrack extends BaseTrack {
  id: `${string}::${string}::${string}`;

  // base-Info
  reciterId: string;
  moshafId: string;

  duration?: number;
}

export interface PlaylistItem extends BaseTrack {}

export type PlaybackSpeed = 1 | 1.5 | 2;
export type PlaybackMode = 'off' | 'shuffle' | 'repeat-one';
