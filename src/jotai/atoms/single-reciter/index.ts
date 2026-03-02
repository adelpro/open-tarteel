import { atom } from 'jotai';

import { Reciter } from '@/types';

// ── Selected reciter ──────────────────────────────────────────────────────────
export const selectedReciterAtom = atom<Reciter | null>(null);
