import { describe, expect, it } from 'vitest';

import {
  clampMidi,
  decibelsFromRms,
  hzFromMidi,
  median,
  midiFromHz,
  noteName,
  rms,
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
