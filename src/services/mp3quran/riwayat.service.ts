import { mp3Fetch, SupportedLanguage } from './fetch-client';

export interface RiwayaApi {
  id: number;
  name: string;
}

interface RiwayatResponse {
  riwayat: RiwayaApi[];
}

export async function getAllRiwayat(
  language: SupportedLanguage = 'ar'
): Promise<RiwayaApi[]> {
  const data = await mp3Fetch<RiwayatResponse>('/riwayat', {
    language,
  });

  return data.riwayat;
}
