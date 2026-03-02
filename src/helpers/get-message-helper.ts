import { DEFAULT_LOCALES } from '../app/[locale]/reciter/[id]/_constants';
import { LocaleKey } from '../app/[locale]/reciter/[id]/_types';

export function getMessageHelper(
  locales: Record<LocaleKey, Record<string, string>> = DEFAULT_LOCALES,
  defaultLocale: LocaleKey = 'ar'
) {
  return function t<K extends string>(
    key: K,
    locale: LocaleKey = defaultLocale
  ) {
    const localeJson = locales[locale];

    const defaultMessage =
      key in localeJson ? localeJson[key] : `[Missing translation: ${key}]`;

    return { id: key, defaultMessage };
  };
}
export const getMessageConfig = getMessageHelper();
