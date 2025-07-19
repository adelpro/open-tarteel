import { Riwaya } from '@/types';

type Locale = 'ar' | 'en';
type RiwayaKey = keyof typeof Riwaya;
type RiwayaMatchMap = Record<RiwayaKey, string[]>;

const riwayaMatchPhrases: Record<Locale, RiwayaMatchMap> = {
  ar: {
    Hafs: ['حفص عن عاصم'],
    Warsh: ['ورش عن نافع'],
    Khalaf: ['خلف عن حمزة'],
    AlBazzi: ['البزي عن ابن كثير'],
    Qaloon: ['قالون عن نافع'],
    AlSoosi: ['السوسي عن أبي عمرو'],
    AlDooriKisai: ['الدوري عن الكسائي'],
    AlDooriAbuAmr: ['الدوري عن أبي عمرو'],
    Shuaba: ['شعبة عن عاصم'],
    IbnZakwan: ['ابن ذكوان عن ابن عامر'],
    Hisham: ['هشام عن ابي عامر'],
    IbnJammaz: ['ابن جماز عن أبي جعفر'],
    Yaqoub: ['يعقوب الحضرمي'],
  },
  en: {
    Hafs: ["Hafs A'n Assem"],
    Warsh: ["Warsh A'n Nafi'"],
    Khalaf: [],
    AlBazzi: ["Albizi and Qunbol A'n Ibn Katheer"],
    Qaloon: ["Qalon A'n Nafi'"],
    AlSoosi: [],
    AlDooriKisai: ["AlDorai A'n Al-Kisa'ai"],
    AlDooriAbuAmr: ["Aldori A'n Abi Amr"],
    Shuaba: ["Sho'bah A'n Asim"],
    IbnZakwan: ["Ibn Thakwan A'n Ibn Amer"],
    Hisham: [],
    IbnJammaz: [],
    Yaqoub: [],
  },
};

const findRiwayaKey = (moshafName: string, locale: Locale): RiwayaKey => {
  const map = riwayaMatchPhrases[locale];
  for (const [key, phrases] of Object.entries(map)) {
    if (phrases.some((phrase) => moshafName.includes(phrase))) {
      return key as RiwayaKey;
    }
  }
  return 'Hafs';
};

export const getRiwayaKeyFromMoshafName = findRiwayaKey;

export const getRiwayaKeyFromValue = (value: string): keyof typeof Riwaya => {
  return (
    (Object.entries(Riwaya).find(
      ([, v]) => v === value
    )?.[0] as keyof typeof Riwaya) || 'Hafs'
  );
};
