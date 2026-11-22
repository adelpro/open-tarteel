import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/reciters/cached', () => ({
  getAllRecitersCached: vi.fn().mockResolvedValue([{ id: 'test-reciter' }]),
}));

import { GET } from './route';

const request = (headers: Record<string, string>) =>
  new NextRequest('http://localhost/api/reciters', { headers });

describe('GET /api/reciters compression', () => {
  it('does not gzip when the request came through Cloudflare', async () => {
    const response = await GET(
      request({ 'accept-encoding': 'gzip', 'cf-ray': 'test-ray' })
    );

    expect(response.headers.get('content-encoding')).toBeNull();
    expect(await response.json()).toEqual([{ id: 'test-reciter' }]);
  });

  it('still gzips for non-Cloudflare hosts', async () => {
    const response = await GET(request({ 'accept-encoding': 'gzip' }));

    expect(response.headers.get('content-encoding')).toBe('gzip');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([...bytes.slice(0, 2)]).toEqual([0x1f, 0x8b]);
  });
});
