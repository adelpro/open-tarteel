import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moshafId: string }> }
) {
  const { id, moshafId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const language = searchParams.get('language') || 'ar';

  try {
    let response: Response;
    if (language === 'ar') {
      response = await fetch(
        `https://www.mp3quran.net/api/v3/reciters?reciter=${id}`,
        {
          headers: {
            revalidate: '3600',
            'User-Agent': 'Open Tarteel',
            Accept: 'application/json, text/plain, */*',
          },
        }
      );
    } else {
      response = await fetch(
        `https://www.mp3quran.net/api/v3/reciters?language=${language}&reciter=${id}`,
        {
          headers: {
            revalidate: '3600',
            'User-Agent': 'Open Tarteel',
            Accept: 'application/json, text/plain, */*',
          },
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch reciter' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reciter = data.reciters?.find(
      (r: { id: number }) => r.id.toString() === id
    );

    if (!reciter) {
      return NextResponse.json({ error: 'Reciter not found' }, { status: 404 });
    }

    const moshaf = reciter.moshaf?.find(
      (m: { id: number }) => m.id.toString() === moshafId
    );

    if (!moshaf) {
      return NextResponse.json({ error: 'Moshaf not found' }, { status: 404 });
    }

    return NextResponse.json({ reciter, moshaf });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
