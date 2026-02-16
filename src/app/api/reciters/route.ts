import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const language = searchParams.get('language') || 'ar';

  try {
    let response: Response;
    if (language === 'ar') {
      response = await fetch(`https://www.mp3quran.net/api/v3/reciters`, {
        headers: {
          revalidate: '3600',
          'User-Agent': 'Open Tarteel',
          Accept: 'application/json, text/plain, */*',
        },
      });
    } else {
      response = await fetch(
        `https://www.mp3quran.net/api/v3/reciters?language=${language}`,
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
      console.error(
        '[API /api/reciters] mp3quran.net response not ok:',
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { error: 'Failed to fetch reciters' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      '[API /api/reciters] Successfully fetched:',
      data.reciters?.length || 0,
      'reciters'
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API /api/reciters] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
