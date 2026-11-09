export const LOCALES = ['ar', 'en', 'de'] as const;

export type SeoLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: SeoLocale = 'ar';

export type SeoRoute = {
  name: string;
  path: string;
  index: boolean;
  sitemap: boolean;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  dynamic?: boolean;
};

/**
 * The one place a public path exists.
 *
 * Metadata, the sitemap, links and the SEO tests read this table. A page that is
 * not here cannot be announced or indexed.
 */
export const ROUTES: readonly SeoRoute[] = [
  {
    name: 'home',
    path: '/',
    index: true,
    sitemap: true,
    changeFrequency: 'daily',
    priority: 1,
  },
  {
    name: 'about',
    path: '/about',
    index: true,
    sitemap: true,
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    name: 'contact',
    path: '/contact',
    index: true,
    sitemap: true,
    changeFrequency: 'monthly',
    priority: 0.4,
  },
  {
    name: 'privacy',
    path: '/privacy',
    index: true,
    sitemap: true,
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    name: 'reciter',
    path: '/reciter/[id]',
    index: true,
    sitemap: true,
    changeFrequency: 'weekly',
    priority: 0.7,
    dynamic: true,
  },
  {
    name: 'settings',
    path: '/settings',
    index: false,
    sitemap: false,
    changeFrequency: 'yearly',
    priority: 0,
  },
  {
    name: 'offline',
    path: '/offline',
    index: false,
    sitemap: false,
    changeFrequency: 'yearly',
    priority: 0,
  },
  {
    name: 'design-preview',
    path: '/design-preview',
    index: false,
    sitemap: false,
    changeFrequency: 'yearly',
    priority: 0,
  },
] as const;

const PREFIXED = new Set<string>(['en', 'de']);

const normalize = (path: string): string => {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
};

/** The path with the locale prefix the public URL uses. Arabic is bare. */
export const withLocale = (locale: SeoLocale, path: string): string => {
  const normalized = normalize(path);
  if (locale === DEFAULT_LOCALE) return normalized;

  const prefix = `/${locale}`;
  if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
    return normalized;
  }
  return normalized === '/' ? prefix : `${prefix}${normalized}`;
};

/** The first segment, when it is a supported locale. */
export const localeFromPath = (path: string): SeoLocale => {
  const segment = normalize(path).split('/')[1];
  return segment && PREFIXED.has(segment) ? (segment as SeoLocale) : DEFAULT_LOCALE;
};

/** The route path without its locale prefix. */
export const stripLocale = (path: string): string => {
  const normalized = normalize(path);
  const locale = localeFromPath(normalized);
  if (locale === DEFAULT_LOCALE) return normalized;

  const stripped = normalized.slice(locale.length + 1);
  return stripped || '/';
};

/** The language twins for a path, including x-default. */
export const alternatesFor = (
  path: string
): Record<SeoLocale | 'x-default', string> => {
  const bare = stripLocale(path);
  return {
    ar: withLocale('ar', bare),
    en: withLocale('en', bare),
    de: withLocale('de', bare),
    'x-default': withLocale('ar', bare),
  };
};

const matchesRoute = (route: SeoRoute, barePath: string): boolean => {
  if (route.dynamic) {
    const prefix = route.path.replace(/\[[^\]]+\]/g, '');
    return barePath.startsWith(prefix);
  }
  return route.path === barePath;
};

/** Whether a public path is allowed to rank. */
export const isIndexable = (path: string): boolean => {
  const bare = stripLocale(path);
  const route = ROUTES.find((candidate) => matchesRoute(candidate, bare));
  return route?.index ?? false;
};

/** The route row for a public path, if one exists. */
export const routeForPath = (path: string): SeoRoute | undefined => {
  const bare = stripLocale(path);
  return ROUTES.find((candidate) => matchesRoute(candidate, bare));
};
