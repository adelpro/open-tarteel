import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { middleware } from './middleware';

const run = (cookie?: string) => {
  const request = new NextRequest('https://staging.test/');
  if (cookie) request.cookies.set('reciter-route', cookie);
  return middleware(request);
};

describe('middleware home redirect', () => {
  it('sends a returning listener to their player', () => {
    const response = run(
      encodeURIComponent('/reciter/mp3quran.net-1?moshafId=1')
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://staging.test/reciter/mp3quran.net-1?moshafId=1'
    );
  });

  it('renders the home when no route cookie exists', () => {
    const response = run();

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('ignores a cookie that is not a reciter route', () => {
    const response = run(encodeURIComponent('https://evil.test/reciter/x'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('ignores a malformed cookie', () => {
    const response = run('%E0%A4%A');

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
