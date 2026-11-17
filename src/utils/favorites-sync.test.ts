import { beforeEach, describe, expect, it } from 'vitest';

import {
  mergeFavorites,
  readLocalFavorites,
  remoteFavoriteIds,
} from './favorites-sync';

describe('mergeFavorites', () => {
  it('keeps favourites made while signed out through the first sign-in', () => {
    const { merged, missing } = mergeFavorites(['a', 'b'], {
      _: { '#': 'soul' },
      c: true,
    });
    expect(merged.sort()).toEqual(['a', 'b', 'c']);
    // The local ones the account lacks are written up for the other devices.
    expect(missing.sort()).toEqual(['a', 'b']);
  });

  it('reads an empty or missing account as no remote favourites', () => {
    expect(mergeFavorites(['a'], null)).toEqual({
      merged: ['a'],
      missing: ['a'],
    });
    expect(mergeFavorites([], {})).toEqual({ merged: [], missing: [] });
  });

  it('writes nothing up when the account already has every local id', () => {
    expect(mergeFavorites(['a'], { a: true, b: true }).missing).toEqual([]);
  });

  it('never counts a cleared key as a favourite', () => {
    // `null` is how a removal is written; it is not a favourite.
    expect(remoteFavoriteIds({ a: null, b: true, _: {} })).toEqual(['b']);
  });

  it('lists every id once', () => {
    expect(mergeFavorites(['a', 'a'], { a: true }).merged).toEqual(['a']);
  });
});

describe('readLocalFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('reads the list the favourites atom persists', () => {
    localStorage.setItem('favorite-reciter', JSON.stringify(['x', 'y']));
    expect(readLocalFavorites()).toEqual(['x', 'y']);
  });

  it('survives corrupt or foreign values', () => {
    localStorage.setItem('favorite-reciter', '{oops');
    expect(readLocalFavorites()).toEqual([]);
    localStorage.setItem('favorite-reciter', JSON.stringify(['x', 3, null]));
    expect(readLocalFavorites()).toEqual(['x']);
  });
});
