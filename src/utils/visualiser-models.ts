/**
 * Spectrum helpers shared by the bars, peaks, and ribbon models.
 *
 * The catalogue is mostly low-bitrate mono audio that is low-passed around
 * 4.5 kHz. A linear frequency axis spends half the strip on silence — which is
 * what made the far end of the row look dead — so every model reads log-spaced
 * bands inside the voice range instead.
 */
export const VISUALISER_MODELS = ['bars', 'peaks', 'ribbon'] as const;
export type VisualiserModel = (typeof VISUALISER_MODELS)[number];

const LOG_MIN_HZ = 90;
const LOG_MAX_HZ = 4500;

/** Peak level of each log-spaced band, bass first. */
export function logBands(
  bins: Uint8Array,
  columns: number,
  sampleRate: number,
  minHz = LOG_MIN_HZ,
  maxHz = LOG_MAX_HZ
): number[] {
  const binHz = sampleRate / 2 / bins.length;
  const octaves = maxHz / minHz;
  const out: number[] = [];

  for (let index = 0; index < columns; index += 1) {
    const low = (minHz * Math.pow(octaves, index / columns)) / binHz;
    const high = (minHz * Math.pow(octaves, (index + 1) / columns)) / binHz;
    // Bin 0 is DC: reading it leaves a notch at the edge of the strip.
    const start = Math.max(1, Math.floor(low));
    const end = Math.min(bins.length, Math.max(start + 1, Math.ceil(high)));
    let peak = 0;
    for (let bin = start; bin < end; bin += 1) {
      if (bins[bin] > peak) peak = bins[bin];
    }
    out.push(peak / 255);
  }

  return out;
}

/** One step of a rise-fast, fall-slow follower. */
export function follow(
  current: number,
  target: number,
  attack: number,
  release: number
): number {
  return current + (target - current) * (target > current ? attack : release);
}

function parseHex(value: string): [number, number, number] {
  const raw = value.trim().replace(/^#/, '');
  const full =
    raw.length === 3 ? raw.replace(/./g, (char) => char + char) : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return [0, 0, 0];
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

export function mixHex(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const clamped = Math.min(1, Math.max(0, t));
  const channel = (index: number) =>
    Math.round(a[index] + (b[index] - a[index]) * clamped)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/** Front to back: the four tints the ribbon's layers are filled with. */
export function waveTints(front: string, back: string): string[] {
  return [0, 1 / 3, 2 / 3, 1].map((t) => mixHex(front, back, t));
}
