import Fuse from 'fuse.js';

import { normalizeArabicText } from '@/utils';

export type AyahEdition = {
  /** alquran.cloud edition identifier, e.g. `ar.alafasy`. */
  identifier: string;
  name: string;
  englishName: string;
};

/**
 * Reciters that have verse-by-verse audio on alquran.cloud. Used to switch
 * from full-surah playback to precise per-ayah playback in reading mode.
 */
export const VERSE_BY_VERSE_EDITIONS: AyahEdition[] = [
  {
    identifier: 'ar.alafasy',
    name: 'مشاري راشد العفاسي',
    englishName: 'Alafasy',
  },
  {
    identifier: 'ar.abdulbasitmurattal',
    name: 'عبد الباسط عبد الصمد',
    englishName: 'Abdul Basit (Murattal)',
  },
  {
    identifier: 'ar.abdulbasitmujawwad',
    name: 'عبد الباسط عبد الصمد (مجوّد)',
    englishName: 'Abdul Basit (Mujawwad)',
  },
  {
    identifier: 'ar.husary',
    name: 'محمود خليل الحصري',
    englishName: 'Husary (Murattal)',
  },
  {
    identifier: 'ar.husarymujawwad',
    name: 'محمود خليل الحصري (مجوّد)',
    englishName: 'Husary (Mujawwad)',
  },
  {
    identifier: 'ar.minshawi',
    name: 'محمد صديق المنشاوي',
    englishName: 'Minshawi (Murattal)',
  },
  {
    identifier: 'ar.minshawimujawwad',
    name: 'محمد صديق المنشاوي (مجوّد)',
    englishName: 'Minshawi (Mujawwad)',
  },
  {
    identifier: 'ar.shaatree',
    name: 'أبو بكر الشاطري',
    englishName: 'Shatree',
  },
  {
    identifier: 'ar.mahermuaiqly',
    name: 'ماهر المعيقلي',
    englishName: 'Maher Al Muaiqly',
  },
  {
    identifier: 'ar.sudais',
    name: 'عبد الرحمن السديس',
    englishName: 'Abdurrahmaan As-Sudais',
  },
  {
    identifier: 'ar.saoodshuraym',
    name: 'سعود الشريم',
    englishName: 'Saood bin Ibraaheem Shuraym',
  },
  {
    identifier: 'ar.aymanswoaid',
    name: 'أيمن سويد',
    englishName: 'Ayman Sowaid',
  },
  {
    identifier: 'ar.ibrahimakhbar',
    name: 'إبراهيم الأخضر',
    englishName: 'Ibraheem Akhder',
  },
  {
    identifier: 'ar.muhammadayyoub',
    name: 'محمد أيوب',
    englishName: 'Muhammad Ayyoub',
  },
  {
    identifier: 'ar.hanirifai',
    name: 'هاني الرفاعي',
    englishName: 'Hani Rifai',
  },
  {
    identifier: 'ar.saadghamdi',
    name: 'سعد الغامدي',
    englishName: 'Saad Al Ghamdi',
  },
];

const EXACT_MAP = new Map<string, AyahEdition>(
  VERSE_BY_VERSE_EDITIONS.map((edition) => [
    normalizeArabicText(edition.name),
    edition,
  ])
);

let fuseInstance: Fuse<AyahEdition> | null = null;

const getFuse = (): Fuse<AyahEdition> => {
  if (fuseInstance) return fuseInstance;
  fuseInstance = new Fuse(VERSE_BY_VERSE_EDITIONS, {
    keys: ['name', 'englishName'],
    threshold: 0.4,
    distance: 200,
    minMatchCharLength: 2,
    ignoreLocation: true,
    isCaseSensitive: false,
    shouldSort: true,
  });
  return fuseInstance;
};

/**
 * Resolves a reciter name to the alquran.cloud verse-by-verse edition that
 * matches it, or `null` when there is no reliable match.
 *
 * Matching strategy:
 * 1. Exact normalized match against known edition names.
 * 2. Containment match (handles prefixes/suffixes like "الشيخ ...").
 * 3. Fuzzy match (handles typos and variations) via Fuse.js.
 */
export function getAyahEditionForReciter(name: string): AyahEdition | null {
  if (!name || name.trim() === '') return null;

  const normalized = normalizeArabicText(name);

  const exact = EXACT_MAP.get(normalized);
  if (exact) return exact;

  for (const edition of VERSE_BY_VERSE_EDITIONS) {
    const editionName = normalizeArabicText(edition.name);
    if (editionName.includes(normalized) || normalized.includes(editionName)) {
      return edition;
    }
  }

  const results = getFuse().search(name);
  return results[0]?.item ?? null;
}
