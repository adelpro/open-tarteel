const normalizeUrl = (url?: string) => url?.replace(/\/+$/, '');

const toValidUrl = (url?: string) => {
  const normalized = normalizeUrl(url);
  if (!normalized) return undefined;

  try {
    return normalizeUrl(new URL(normalized).toString());
  } catch {
    return undefined;
  }
};

/**
 * Public URL of the deployed application.
 *
 * `NEXT_PUBLIC_APP_URL` is the canonical variable. The legacy
 * `NEXT_PUBLIC_TARTEEL_APP_URL` name is still accepted so existing
 * deployments keep working.
 */
const appUrl =
  toValidUrl(process.env.NEXT_PUBLIC_APP_URL) ||
  toValidUrl(process.env.NEXT_PUBLIC_TARTEEL_APP_URL) ||
  'http://localhost:3000';

export const clientConfig = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Open Tarteel',
  APP_URL: appUrl,
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || 'N/A',
  DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true',
} as const;

export const serverConfig = {
  PORT: process.env.PORT || 3000,
  FEED_BACK_EMAIL: process.env.FEED_BACK_EMAIL,
  FEED_BACK_PASSWORD: process.env.FEED_BACK_PASSWORD,
  FEED_BACK_SERVICE: process.env.FEED_BACK_SERVICE,
  FEED_BACK_HOST: process.env.FEED_BACK_HOST,
  FEED_BACK_PORT: process.env.FEED_BACK_PORT,
} as const;
