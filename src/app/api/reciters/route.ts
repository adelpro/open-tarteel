import { NextRequest, NextResponse } from 'next/server';

import {
  getAllRecitersFromAdapters,
  parseEnabledSources,
} from '@/services/reciters';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const language =
    (searchParams.get('language') || 'ar') === 'eng' ? 'en' : 'ar';

  const sourcesParam = searchParams.get('sources');
  const cookie = request.cookies.get('enabled-sources')?.value;
  const enabledSources = parseEnabledSources(sourcesParam ?? cookie);

  try {
    const reciters = await getAllRecitersFromAdapters(language, enabledSources);
    return NextResponse.json(reciters);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reciters' },
      { status: 500 }
    );
  }
}
