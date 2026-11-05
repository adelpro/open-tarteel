import { NextRequest, NextResponse } from 'next/server';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import { parseEnabledSources } from '@/services/reciters';
import { getAllRecitersCached } from '@/services/reciters/cached';

// The response depends on the user's enabled sources (query or cookie), so it
// must never be cached at the CDN or shared between users.
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

    return NextResponse.json(reciters, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        Vary: 'Cookie',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reciters' },
      { status: 500 }
    );
  }
}
