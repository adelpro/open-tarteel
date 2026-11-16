/** Pure helpers behind the pitch contour, so the canvas stays untested code. */

const A4_HZ = 440;
const A4_MIDI = 69;

const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export const midiFromHz = (hz: number): number =>
  A4_MIDI + 12 * Math.log2(hz / A4_HZ);

export const hzFromMidi = (midi: number): number =>
  A4_HZ * 2 ** ((midi - A4_MIDI) / 12);

/** Scientific pitch name, e.g. 45 -> A2. */
export function noteName(midi: number): string {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${octave}`;
}

/** Median of the last N values; null when nothing is left after filtering. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/** Root mean square of a time-domain buffer, 0 to 1 for normalised audio. */
export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

export const decibelsFromRms = (value: number): number =>
  value <= 0 ? -Infinity : 20 * Math.log10(value);

/** Clamp a MIDI value into the visible range. */
export const clampMidi = (midi: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, midi));

/**
 * Split a frame history into runs of consecutive voiced frames.
 *
 * Silence is a gap, not a link: joining the last note before a pause to the
 * first note after it would draw a note the reciter never made. Unvoiced
 * frames are the separators and are not returned.
 */
export function voicedRuns<T extends { midi: number | null }>(
  samples: readonly T[]
): T[][] {
  const runs: T[][] = [];
  let run: T[] = [];

  for (const sample of samples) {
    if (sample.midi == null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else {
      run.push(sample);
    }
  }
  if (run.length > 0) runs.push(run);

  return runs;
}

/**
 * One-euro filter: adaptive low-pass for noisy interactive signals.
 * Slow when the value is steady, fast when it moves, so a glide is followed
 * without the stair-steps a median filter leaves behind.
 * Casiez, Roussel, Vogel, CHI 2012.
 */
export class OneEuroFilter {
  private previousValue: number | null = null;
  private previousSlope = 0;
  private previousTime: number | null = null;

  constructor(
    private readonly minCutoff = 1.5,
    private readonly beta = 0.01,
    private readonly slopeCutoff = 1
  ) {}

  private static alpha(cutoff: number, deltaSeconds: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / Math.max(1e-3, deltaSeconds));
  }

  smooth(value: number, timeSeconds: number): number {
    if (this.previousValue == null || this.previousTime == null) {
      this.previousValue = value;
      this.previousTime = timeSeconds;
      return value;
    }

    const delta = Math.max(1e-3, timeSeconds - this.previousTime);
    const slope = (value - this.previousValue) / delta;
    const slopeAlpha = OneEuroFilter.alpha(this.slopeCutoff, delta);
    this.previousSlope =
      slopeAlpha * slope + (1 - slopeAlpha) * this.previousSlope;

    const cutoff = this.minCutoff + this.beta * Math.abs(this.previousSlope);
    const alpha = OneEuroFilter.alpha(cutoff, delta);
    const smoothed = alpha * value + (1 - alpha) * this.previousValue;

    this.previousValue = smoothed;
    this.previousTime = timeSeconds;
    return smoothed;
  }

  reset(): void {
    this.previousValue = null;
    this.previousSlope = 0;
    this.previousTime = null;
  }
}

/**
 * MPM occasionally reports double or half the real frequency. When the jump is
 * close to an octave and the frame is not very clear, keep the previous octave
 * instead of drawing a spike.
 */
export function correctOctave(
  previousMidi: number | null,
  midi: number,
  clarity: number
): number {
  if (previousMidi == null || clarity >= 0.95) return midi;
  const delta = midi - previousMidi;
  if (delta >= 10 && delta <= 14) return midi - 12;
  if (delta <= -10 && delta >= -14) return midi + 12;
  return midi;
}
