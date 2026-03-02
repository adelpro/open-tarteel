import { LIBRARY_TABS } from '@/constants';

export type LibraryTab = (typeof LIBRARY_TABS)[keyof typeof LIBRARY_TABS];
