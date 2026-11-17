import { describe, expect, it } from 'vitest';

import ar from '@/locales/ar.json';
import de from '@/locales/de.json';
import en from '@/locales/en.json';

import { messages } from './messages';

const LOCALES = { ar, en, de } as Record<string, Record<string, string>>;
const ids = Object.values(messages).map((message) => message.id);
const privacyIds = [
  'privacy.ring.title',
  'privacy.ring.body',
  'privacy.ring.point1',
  'privacy.ring.point2',
  'privacy.ring.point3',
];

describe('account strings', () => {
  it.each(Object.keys(LOCALES))('are all translated in %s', (locale) => {
    const missing = [...ids, ...privacyIds].filter(
      (id) => !LOCALES[locale][id]
    );
    expect(missing).toEqual([]);
  });

  it('use the English locale as the default message', () => {
    for (const message of Object.values(messages)) {
      expect(en[message.id as keyof typeof en]).toBe(message.defaultMessage);
    }
  });

  it('carry no account key that the components do not use', () => {
    for (const locale of Object.values(LOCALES)) {
      const extra = Object.keys(locale).filter(
        (id) => id.startsWith('account.') && !ids.includes(id)
      );
      expect(extra).toEqual([]);
    }
  });
});
