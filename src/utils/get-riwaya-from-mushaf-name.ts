import { Riwaya } from '@/types';

export const getRiwayaFromMoshafName = (moshafName: string): Riwaya => {
  // Extract the main riwaya name from the moshaf name
  if (moshafName.includes('حفص عن عاصم')) {
    return Riwaya.Hafs;
  }
  if (moshafName.includes('ورش عن نافع')) {
    return Riwaya.Warsh;
  }
  if (moshafName.includes('خلف عن حمزة')) {
    return Riwaya.Khalaf;
  }
  if (moshafName.includes('البزي عن ابن كثير')) {
    return Riwaya.AlBazzi;
  }
  if (moshafName.includes('قالون عن نافع')) {
    return Riwaya.Qaloon;
  }
  if (moshafName.includes('قنبل عن ابن كثير')) {
    return Riwaya.Qunbul;
  }
  if (moshafName.includes('السوسي عن أبي عمرو')) {
    return Riwaya.AlSoosi;
  }
  if (moshafName.includes('الدوري عن الكسائي')) {
    return Riwaya.AlDooriKisai;
  }
  if (moshafName.includes('الدوري عن أبي عمرو')) {
    return Riwaya.AlDooriAbuAmr;
  }
  if (moshafName.includes('شعبة عن عاصم')) {
    return Riwaya.Shuaba;
  }
  if (moshafName.includes('ابن ذكوان عن ابن عامر')) {
    return Riwaya.IbnZakwan;
  }
  if (moshafName.includes('هشام عن ابي عامر')) {
    return Riwaya.Hisham;
  }
  if (moshafName.includes('ابن جماز عن أبي جعفر')) {
    return Riwaya.IbnJammaz;
  }
  if (moshafName.includes('يعقوب الحضرمي')) {
    return Riwaya.Yaqoub;
  }

  // Default fallback
  return Riwaya.Hafs;
};
