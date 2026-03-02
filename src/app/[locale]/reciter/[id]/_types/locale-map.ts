import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

export type LocaleMap = {
  ar: typeof ar;
  en: typeof en;
};

type EnsureSameKeys<A, B> = keyof A extends keyof B
  ? keyof B extends keyof A
    ? true
    : never
  : never;

export type _check = EnsureSameKeys<typeof ar, typeof en>;
