import { NextRequest, NextResponse } from 'next/server';

import { getAllRecitersFromAdapters } from '@/services/reciters';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const language =
    (searchParams.get('language') || 'ar') === 'eng' ? 'en' : 'ar';

  try {
    const reciters = await getAllRecitersFromAdapters(language);
    return NextResponse.json(reciters);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reciters' },
      { status: 500 }
    );
  }
}
