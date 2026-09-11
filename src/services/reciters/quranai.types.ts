export type QuranAiEdition = {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string | null;
  narratorIdentifier: string | null;
  recitationType?: string;
};

export type QuranAiEditionListResponse = {
  code: number;
  status: string;
  data: QuranAiEdition[];
};

export type QuranAiAyah = {
  number: number;
  numberInSurah: number;
  audio: string;
};

export type QuranAiSurahResponse = {
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
};
