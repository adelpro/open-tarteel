const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

const APP_PREFIX = 'open-tarteel';
export const FAVORITE_COUNTS_KEY = `${APP_PREFIX}-${ENV_PREFIX}-favorite-counts`;

export const VIEW_COUNTS_KEY = `${APP_PREFIX}-${ENV_PREFIX}-view-counts`;
