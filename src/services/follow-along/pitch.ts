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
