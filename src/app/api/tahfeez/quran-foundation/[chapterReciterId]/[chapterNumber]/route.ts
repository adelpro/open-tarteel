import { NextRequest, NextResponse } from 'next/server';
import { getSurahTahfeezSegments } from '@/services/reciters/quran-foundation.provider';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ chapterReciterId: string; chapterNumber: string }> }
) {
  const { chapterReciterId: rawReciterId, chapterNumber: rawChapterNumber } =
    await params;
  const chapterReciterId = Number(rawReciterId);
  const chapterNumber = Number(rawChapterNumber);

  if (!Number.isInteger(chapterReciterId) || !Number.isInteger(chapterNumber)) {
    return NextResponse.json({ error: 'invalid params' }, { status: 400 });
  }

  try {
    const segments = await getSurahTahfeezSegments(
      chapterReciterId,
      chapterNumber
    );
    if (!segments) {
      return NextResponse.json({ segments: null }, { status: 200 });
    }
    return NextResponse.json({ segments }, { status: 200 });
  } catch (_error) {
    return NextResponse.json(
      { error: 'quran.foundation request failed' },
      { status: 502 }
    );
  }
}
