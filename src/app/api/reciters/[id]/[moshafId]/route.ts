import { NextRequest, NextResponse } from 'next/server';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import {
  getAllRecitersFromAdapters,
  parseEnabledSources,
} from '@/services/reciters';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moshafId: string }> }
) {
  const { id, moshafId } = await params;
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

    const reciter = reciters.find(
      (r) => r.id === id && r.moshaf.id === moshafId
    );

    if (!reciter) {
      return NextResponse.json({ error: 'Reciter not found' }, { status: 404 });
    }

    return NextResponse.json(reciter);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
