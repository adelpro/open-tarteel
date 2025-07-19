import { Riwaya } from '@/types';

export const RiwayaNameByLocale: Record<
  'ar' | 'en',
  Record<keyof typeof Riwaya, string>
> = {
  ar: {
    Hafs: 'حفص',
    Warsh: 'ورش',
    Qaloon: 'قالون',
    Khalaf: 'خلف',
    AlBazzi: 'البزي',
    AlSoosi: 'السوسي',
    AlDooriKisai: 'الدوري (الكسائي)',
    AlDooriAbuAmr: 'الدوري (أبو عمرو)',
    Shuaba: 'شعبة',
    IbnZakwan: 'ابن ذكوان',
    Hisham: 'هشام',
    IbnJammaz: 'ابن جماز',
    Yaqoub: 'يعقوب',
  },
  en: {
    Hafs: 'Hafs',
    Warsh: 'Warsh',
    Qaloon: 'Qaloon',
    Khalaf: 'Khalaf',
    AlBazzi: 'Al-Bazzi',
    AlSoosi: 'Al-Soosi',
    AlDooriKisai: 'Al-Doori (Kisai)',
    AlDooriAbuAmr: 'Al-Doori (Abu Amr)',
    Shuaba: 'Shuaba',
    IbnZakwan: 'Ibn Zakwan',
    Hisham: 'Hisham',
    IbnJammaz: 'Ibn Jammaz',
    Yaqoub: 'Yaqoub',
  },
};
