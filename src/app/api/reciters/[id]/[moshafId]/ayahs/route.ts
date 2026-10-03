import { NextRequest, NextResponse } from 'next/server';

import { AYAH_AUDIO_SUPPORTED_SOURCES, SURAHS } from '@/constants';
import { getAyahAudioRange } from '@/services/reciters';

const parseInteger = (value: string | null): number | undefined => {
  if (value === null) return undefined;

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : undefined;
};

interface ValidatedRange {
  surahNumber: number;
  startAyah: number;
  endAyah: number;
}

const validateAyahQueryParams = (
  searchParams: URLSearchParams
): { data: ValidatedRange } | { error: string; status: number } => {
  const surahNumber = parseInteger(searchParams.get('surah'));
  const startAyah = parseInteger(searchParams.get('startAyah'));
  const endAyah = parseInteger(searchParams.get('endAyah'));

  if (
    surahNumber === undefined ||
    startAyah === undefined ||
    endAyah === undefined
  ) {
    return {
      error:
        'surah, startAyah and endAyah query parameters are required integers',
      status: 400,
    };
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
    return {
      error: 'Invalid surah or ayah range',
      status: 400,
    };
  }

  return { data: { surahNumber, startAyah, endAyah } };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; moshafId: string }> }
) {
  const { id, moshafId } = await params;
  const isSupportedSource = AYAH_AUDIO_SUPPORTED_SOURCES.some((source) =>
    id.startsWith(`${source}-`)
  );

  if (!isSupportedSource) {
    return NextResponse.json(
      { error: 'Ayah audio is not supported for this source' },
      { status: 404 }
    );
  }

  const validation = validateAyahQueryParams(request.nextUrl.searchParams);
  if ('error' in validation) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  const { surahNumber, startAyah, endAyah } = validation.data;

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
