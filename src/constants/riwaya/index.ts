import { MessageKey } from '@/types';

export enum Riwaya {
  Hafs = 'حفص',
  Warsh = 'ورش',
  Qaloon = 'قالون',
  Khalaf = 'خلف',
  AlBazzi = 'البزي',
  AlSoosi = 'السوسي',
  AlDooriKisai = 'الدوري-الكسائي',
  AlDooriAbuAmr = 'الدوري-أبي-عمرو',
  Shuaba = 'شعبة',
  IbnZakwan = 'ابن-ذكوان',
  Hisham = 'هشام',
  IbnJammaz = 'ابن-جماز',
  Yaqoub = 'يعقوب',
}

type RiwayaEnumKey = keyof typeof Riwaya;
type RiwayaMessageKey = Extract<MessageKey, `riwaya.${string}`>;
type ExpectedRiwayaMessageKey = `riwaya.${RiwayaEnumKey}`;
type MissingRiwayaMessages = Exclude<
  ExpectedRiwayaMessageKey,
  RiwayaMessageKey
>;
export type _RiwayaMessagesMustExist = MissingRiwayaMessages extends never
  ? true
  : never;

export const RIWAYA_MESSAGE_ID_MAP = new Map<Riwaya, RiwayaMessageKey>(
  (Object.keys(Riwaya) as RiwayaEnumKey[]).map((key) => {
    const value = Riwaya[key];
    const messageKey: RiwayaMessageKey = `riwaya.${key}`;
    return [value, messageKey];
  })
);
