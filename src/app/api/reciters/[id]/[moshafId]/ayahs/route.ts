import { NextRequest, NextResponse } from 'next/server';

import { getAyahAudioRange } from '@/services/reciters';
import { LinkSource } from '@/types';

export const revalidate = 3600;

const parseInteger = (
  value: string | null
): number | undefined => {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moshafId: string }> }
) {
  const { id, moshafId } = await params;
  const searchParams = request.nextUrl.searchParams;

  if (!id.startsWith(`${LinkSource.QURANAI}-`)) {
    return NextResponse.json(
      { error: 'Ayah audio is not supported for this source' },
      { status: 404 }
    );
  }

  const surahNumber = parseInteger(searchParams.get('surah'));
  const startAyah = parseInteger(searchParams.get('startAyah'));
  const endAyah = parseInteger(searchParams.get('endAyah'));

  if (
    surahNumber === undefined ||
    startAyah === undefined ||
    endAyah === undefined
  ) {
    return NextResponse.json(
      {
        error:
          'surah, startAyah and endAyah query parameters are required integers',
      },
      { status: 400 }
    );
  }

  if (
    surahNumber < 1 ||
    surahNumber > 114 ||
    startAyah < 1 ||
    endAyah < startAyah
  ) {
    return NextResponse.json(
      { error: 'Invalid surah or ayah range' },
      { status: 400 }
    );
  }

  try {
    const ayahs = await getAyahAudioRange({
      editionIdentifier: moshafId,
      surahNumber,
      startAyah,
      endAyah,
    });

    return NextResponse.json({ ayahs });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch ayah audio' },
      { status: 500 }
    );
  }
}