export type SurahAyahText = {
  numberInSurah: number;
  text: string;
};

export type SurahText = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  ayahs: SurahAyahText[];
};
