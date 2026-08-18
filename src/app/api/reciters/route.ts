import { NextRequest, NextResponse } from 'next/server';

import {
  getAllRecitersFromAdapters,
  parseEnabledSources,
} from '@/services/reciters';
import { LANGUAGES } from '@/constants/language';
import type { Language } from '@/constants/language';

// Enable Next.js caching with 1 hour revalidation
export const revalidate = 3600;

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
    const reciters = await getAllRecitersFromAdapters(language, enabledSources);

    // Add cache headers for client-side caching
    return NextResponse.json(reciters, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reciters' },
      { status: 500 }
    );
  }
}
