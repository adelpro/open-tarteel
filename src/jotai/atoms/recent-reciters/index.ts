import { atom } from 'jotai';

import type { RecentReciterEntry } from '@/types';

// ── Selected reciter ──────────────────────────────────────────────────────────
export const recentRecitersAtom = atom<RecentReciterEntry[]>([]);
