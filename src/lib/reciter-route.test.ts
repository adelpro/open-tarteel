import { describe, expect, it } from 'vitest';

import { isReciterRoute, reciterRouteFor } from './reciter-route';

describe('reciterRouteFor', () => {
  it('builds the canonical player route', () => {
    expect(
      reciterRouteFor({
        id: 'mp3quran.net-1',
        moshaf: { id: '1' },
      })
    ).toBe('/reciter/mp3quran.net-1?moshafId=1');
  });

  it('encodes ids that contain URL characters', () => {
    expect(
      reciterRouteFor({
        id: 'a/b?c',
        moshaf: { id: '1 2' },
      })
    ).toBe('/reciter/a%2Fb%3Fc?moshafId=1%202');
  });
});

describe('isReciterRoute', () => {
  it('accepts a same-origin reciter route', () => {
    expect(isReciterRoute('/reciter/mp3quran.net-1?moshafId=1')).toBe(true);
  });

  it('rejects an absolute URL', () => {
    expect(isReciterRoute('https://evil.test/reciter/x?moshafId=1')).toBe(
      false
    );
  });

  it('rejects a protocol-relative URL', () => {
    expect(isReciterRoute('//evil.test/reciter/x?moshafId=1')).toBe(false);
  });

  it('rejects a route without a moshaf', () => {
    expect(isReciterRoute('/reciter/mp3quran.net-1')).toBe(false);
  });
});
