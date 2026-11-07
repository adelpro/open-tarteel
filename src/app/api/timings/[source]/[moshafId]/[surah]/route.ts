import { NextRequest, NextResponse } from 'next/server';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import {
  getAllRecitersCached,
  getSurahTimingsCached,
} from '@/services/reciters/cached';
import { HttpStatusError } from '@/services/reciters/shared-fetch';
import { LinkSource } from '@/types';

export const dynamic = 'force-dynamic';

const SOURCES = new Set<string>(Object.values(LinkSource));

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ source: string; moshafId: string; surah: string }>;
  }
) {
  const { source, moshafId, surah: rawSurah } = await params;
  const surah = Number(rawSurah);

  if (!SOURCES.has(source)) {
    return NextResponse.json({ error: 'Unknown source' }, { status: 400 });
  }
  if (!moshafId || !Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const requestedLanguage = request.nextUrl.searchParams.get('language');
  const language: Language =
    requestedLanguage && requestedLanguage in LANGUAGES
      ? (requestedLanguage as Language)
      : 'ar';

  try {
    const reciters = await getAllRecitersCached(language, [
      source as LinkSource,
    ]);
    const reciter = reciters.find((item) => item.moshaf.id === moshafId);
    if (!reciter) {
      return NextResponse.json({ error: 'Reciter not found' }, { status: 404 });
    }

    const timings = await getSurahTimingsCached(
      source as LinkSource,
      reciter.moshaf,
      surah
    );

    return NextResponse.json(
      { timings },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          Vary: 'Cookie',
        },
      }
    );
  } catch (error) {
    const rateLimited =
      error instanceof HttpStatusError && error.status === 429;

    return NextResponse.json(
      {
        error: rateLimited
          ? 'Timing provider rate limited'
          : 'Timing provider failed',
      },
      {
        status: rateLimited ? 429 : 502,
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'Retry-After': rateLimited
            ? ((error as HttpStatusError).retryAfter ?? '30')
            : '5',
          Vary: 'Cookie',
        },
      }
    );
  }
}
