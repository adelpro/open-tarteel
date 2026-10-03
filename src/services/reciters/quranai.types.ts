export interface QuranAiEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string | null;
  narratorIdentifier: string | null;
  recitationType?: string;
}

export interface QuranAiEditionListResponse {
  code: number;
  status: string;
  data: QuranAiEdition[];
}

export interface QuranAiAyah {
  number: number;
  numberInSurah: number;
  audio: string;
}

export interface QuranAiSurahResponse {
  code: number;
  status: string;
  data: {
    number: number;
    numberOfAyahs: number;
    audio: string;
    ayahs: QuranAiAyah[];
    edition: {
      identifier: string;
      type: string;
    };
  };
}
