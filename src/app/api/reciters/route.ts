import { gzipSync } from 'node:zlib';

import { NextRequest, NextResponse } from 'next/server';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import { parseEnabledSources } from '@/services/reciters';
import { getAllRecitersCached } from '@/services/reciters/cached';

// The response depends on the user's enabled sources (query or cookie), so it
// is private per user. A short browser cache avoids a refetch on every
// remount; the catalog itself is already cached server-side.
const CACHE_CONTROL = 'private, max-age=300, stale-while-revalidate=3600';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedLanguage = searchParams.get('language');

  const language: Language =
    requestedLanguage && requestedLanguage in LANGUAGES
      ? (requestedLanguage as Language)
      : 'ar';

  const sourcesParameter = searchParams.get('sources');
  const cookie = request.cookies.get('enabled-sources')?.value;
  const enabledSources = parseEnabledSources(sourcesParameter ?? cookie);

  try {
    const reciters = await getAllRecitersCached(language, enabledSources);
    const body = JSON.stringify(reciters);
    const headers = {
      'Cache-Control': CACHE_CONTROL,
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Cookie, Accept-Encoding',
    };

    if ((request.headers.get('accept-encoding') ?? '').includes('gzip')) {
      return new NextResponse(new Uint8Array(gzipSync(body)), {
        headers: { ...headers, 'Content-Encoding': 'gzip' },
      });
    }

    return new NextResponse(body, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reciters' },
      { status: 500 }
    );
  }
}
