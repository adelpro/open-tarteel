import { NextRequest, NextResponse } from 'next/server';

import type { Language } from '@/constants/language';
import { LANGUAGES } from '@/constants/language';
import { parseEnabledSources } from '@/services/reciters';
import {
  getAllRecitersCached,
  getReciterPlaylistCached,
} from '@/services/reciters/cached';

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
    const reciters = await getAllRecitersCached(language, enabledSources);

    const reciter = reciters.find(
      (r) => r.id === id && r.moshaf.id === moshafId
    );

    if (!reciter) {
      return NextResponse.json({ error: 'Reciter not found' }, { status: 404 });
    }

    // Some providers (Itqan) omit the 114-track playlist from the catalog and
    // expose it lazily. Hydrate it here so the player only downloads it when a
    // reciter is actually selected.
    let resolved = reciter;
    if (reciter.moshaf.playlist.length === 0) {
      try {
        const playlist = await getReciterPlaylistCached(
          reciter.source,
          moshafId,
          language
        );
        if (playlist && playlist.length > 0) {
          resolved = {
            ...reciter,
            moshaf: {
              ...reciter.moshaf,
              playlist,
              surah_total: String(playlist.length),
            },
          };
        }
      } catch {
        // Keep the catalog entry with an empty playlist; the UI shows a
        // loading/error state instead of failing the whole request.
      }
    }

    return NextResponse.json(resolved, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        Vary: 'Cookie',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
