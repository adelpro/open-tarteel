import { NextRequest, NextResponse } from 'next/server';

import { AYAH_AUDIO_SUPPORTED_SOURCES, SURAHS } from '@/constants';
import { getAyahAudioRange } from '@/services/reciters';

const parseInteger = (value: string | null): number | undefined => {
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

  const isSupportedSource = AYAH_AUDIO_SUPPORTED_SOURCES.some((source) =>
    id.startsWith(`${source}-`)
  );

  if (!isSupportedSource) {
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

  const surah = SURAHS.find(({ id }) => id === surahNumber);

  if (
    !surah ||
    startAyah < 1 ||
    endAyah < 1 ||
    startAyah > endAyah ||
    startAyah > surah.ayahCount ||
    endAyah > surah.ayahCount
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