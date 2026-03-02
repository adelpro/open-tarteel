import { Riwaya } from '@/constants';
import type { Playlist, Reciter } from '@/types';
import { LinkSource } from '@/types';
import { getRiwayaKeyFromMoshafName } from '@/utils';

import type {
  ItqanRecitationDetailResponse,
  ItqanRecitationResponse,
} from './itqan.types';
import type { ReciterSource } from './reciter-source';

const BASE_URL = 'https://api.cms.itqan.dev';

export const ItqanAdapter: ReciterSource = {
  source: LinkSource.ITQAN,

  async getReciters(): Promise<Reciter[]> {
    const recitationsResponse = await fetch(`${BASE_URL}/recitations/`);
    if (!recitationsResponse.ok) {
      throw new Error('Failed to fetch Itqan recitations');
    }

    const recitationsData: ItqanRecitationResponse =
      await recitationsResponse.json();

    const results: Array<Reciter | null> = await Promise.all(
      recitationsData.results.map(async (recitation) => {
        try {
          const detailResponse = await fetch(
            `${BASE_URL}/recitations/${recitation.id}`
          );
          if (!detailResponse.ok) {
            throw new Error(
              `Failed to fetch recitation detail for ${recitation.name}`
            );
          }

          const detailData: ItqanRecitationDetailResponse =
            await detailResponse.json();

          const playlist: Playlist = detailData.results.map((surah) => ({
            surahId: String(surah.surah_number),
            link: surah.audio_url,
          }));

          const riwayaKey = getRiwayaKeyFromMoshafName(
            recitation?.riwayah?.name,
            'ar'
          );

          return {
            id: `${LinkSource.ITQAN}-${recitation.reciter.id}`,
            name: recitation.reciter.name,
            source: LinkSource.ITQAN,
            moshaf: {
              id: String(recitation.id),
              name: recitation.name,
              riwaya: Riwaya[riwayaKey],
              server: '',
              surah_total: playlist.length,
              playlist,
            },
          } satisfies Reciter;
        } catch (error) {
          console.warn(
            `Skipping Itqan reciter ${recitation.reciter.name}:`,
            error
          );
          return null;
        }
      })
    );

    return results.filter((r): r is Reciter => r !== null);
  },
};
