import { describe, expect, it } from 'vitest';

import {
  clampMidi,
  correctOctave,
  decibelsFromRms,
  hzFromMidi,
  median,
  midiFromHz,
  noteName,
  OneEuroFilter,
  rms,
  voicedRuns,
} from './pitch';

describe('pitch helpers', () => {
  it('converts between Hz and MIDI at A4', () => {
    expect(midiFromHz(440)).toBeCloseTo(69, 6);
    expect(hzFromMidi(69)).toBeCloseTo(440, 6);
    expect(hzFromMidi(57)).toBeCloseTo(220, 6);
  });

  it('names notes with the scientific octave', () => {
    expect(noteName(45)).toBe('A2');
    expect(noteName(60)).toBe('C4');
    expect(noteName(69)).toBe('A4');
    expect(noteName(70)).toBe('A#4');
  });

  it('takes the median of odd, even and empty lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('computes RMS and decibels', () => {
    expect(rms(new Float32Array([1, -1, 0, 0]))).toBeCloseTo(0.7071, 3);
    expect(rms(new Float32Array([]))).toBe(0);
    expect(decibelsFromRms(0)).toBe(-Infinity);
    expect(decibelsFromRms(1)).toBe(0);
    expect(decibelsFromRms(0.5)).toBeCloseTo(-6.02, 1);
  });

  it('clamps into the visible range', () => {
    expect(clampMidi(40, 45, 62)).toBe(45);
    expect(clampMidi(70, 45, 62)).toBe(62);
    expect(clampMidi(50, 45, 62)).toBe(50);
  });
});

describe('OneEuroFilter', () => {
  it('passes the first value through', () => {
    const filter = new OneEuroFilter();
    expect(filter.smooth(55, 0)).toBe(55);
  });

  it('smooths a steady signal toward the value', () => {
    const filter = new OneEuroFilter();
    filter.smooth(55, 0);
    const next = filter.smooth(56, 0.016);
    expect(next).toBeGreaterThan(55);
    expect(next).toBeLessThan(56);
  });

  it('follows a sustained move', () => {
    const filter = new OneEuroFilter();
    filter.smooth(55, 0);
    let value = 55;
    for (let step = 1; step <= 40; step++) {
      value = filter.smooth(59, step * 0.016);
    }
    expect(value).toBeGreaterThan(58.5);
    expect(value).toBeLessThanOrEqual(59.01);
  });

  it('resets cleanly', () => {
    const filter = new OneEuroFilter();
    filter.smooth(55, 0);
    filter.reset();
    expect(filter.smooth(40, 1)).toBe(40);
  });
});

describe('correctOctave', () => {
  it('pulls a doubled octave back when clarity is low', () => {
    expect(correctOctave(55, 67, 0.8)).toBe(55);
    expect(correctOctave(55, 43, 0.8)).toBe(55);
  });

  it('keeps clear octave jumps', () => {
    expect(correctOctave(55, 67, 0.99)).toBe(67);
  });

  it('keeps ordinary movement', () => {
    expect(correctOctave(55, 57, 0.7)).toBe(57);
    expect(correctOctave(null, 60, 0.5)).toBe(60);
  });
});

describe('voicedRuns', () => {
  const frame = (time: number, midi: number | null) => ({ time, midi });

  it('keeps one run when the voice never stops', () => {
    const runs = voicedRuns([frame(0, 55), frame(0.1, 56), frame(0.2, 57)]);
    expect(runs).toHaveLength(1);
    expect(runs[0].map((sample) => sample.midi)).toEqual([55, 56, 57]);
  });

  it('splits a pause into two runs so nothing is drawn across it', () => {
    const runs = voicedRuns([
      frame(0, 55),
      frame(0.1, 56),
      frame(0.2, null),
      frame(0.3, null),
      frame(0.4, 50),
      frame(0.5, 51),
    ]);

    expect(runs).toHaveLength(2);
    expect(runs[0].map((sample) => sample.time)).toEqual([0, 0.1]);
    expect(runs[1].map((sample) => sample.time)).toEqual([0.4, 0.5]);
  });

  it('drops runs that never sound', () => {
    const runs = voicedRuns([frame(0, null), frame(0.1, null)]);
    expect(runs).toEqual([]);
  });

  it('keeps a lone voiced frame so the caller can decide about it', () => {
    const runs = voicedRuns([frame(0, null), frame(0.1, 55), frame(0.2, null)]);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(1);
  });
});
