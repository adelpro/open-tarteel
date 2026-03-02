import { LocaleType } from '@/types';

import { createAtomWithStorage } from '../create-atom-with-storage';

export const localeAtom = createAtomWithStorage<LocaleType>('locale', 'ar');
