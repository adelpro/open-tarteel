import { NextRequest, NextResponse } from 'next/server';

// Surah text never changes, so cache for a very long time.
export const revalidate = 31536000;

const BASE_URL = 'https://api.alquran.cloud/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const edition = searchParams.get('edition') || 'quran-uthmani';

  if (!/^\d{1,3}$/.test(id) || Number(id) < 1 || Number(id) > 114) {
    return NextResponse.json({ error: 'Invalid surah id' }, { status: 400 });
  }

  try {
    const response = await fetch(`${BASE_URL}/surah/${id}/${edition}`, {
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch surah' },
        { status: response.status }
      );
    }

    const json = await response.json();

    return NextResponse.json(json.data, {
      headers: {
        'Cache-Control':
          'public, s-maxage=31536000, max-age=86400, stale-while-revalidate=604800, immutable',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch surah' },
      { status: 502 }
    );
  }
}
