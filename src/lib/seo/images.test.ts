import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const size = (path: string) => {
  const buffer = readFileSync(path);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

describe('social images', () => {
  it('uses 1200x630 for OG and Twitter', () => {
    expect(size('src/app/opengraph-image.png')).toEqual({
      width: 1200,
      height: 630,
    });
    expect(size('src/app/twitter-image.png')).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
