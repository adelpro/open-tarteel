export const LANGUAGES = {
  ar: {
    label: 'العربية'
    
  },
  en: {
    label: 'English'
    
  },
  de: {
    label: 'Deutsch'
  },
} as const;

export type Language = keyof typeof LANGUAGES;