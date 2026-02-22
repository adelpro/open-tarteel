export type Mp3QuranApiResponse = {
  reciters: Mp3QuranApiReciter[];
};

export type Mp3QuranApiReciter = {
  id: number;
  name: string;
  letter: string;
  moshaf: Mp3QuranApiMoshaf[];
};

export type Mp3QuranApiMoshaf = {
  id: number;
  name: string;
  server: string;
  surah_total: number;
  surah_list: string;
  moshaf_type: number;
};
