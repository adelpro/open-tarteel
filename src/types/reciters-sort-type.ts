export const SORT_TYPE = {
  POPULAR: 'popular',
  ALPHABETICAL: 'alphabetical',
  VIEWS: 'views',
} as const;

export type RecitersSortType = (typeof SORT_TYPE)[keyof typeof SORT_TYPE];
