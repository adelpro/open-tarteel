export const clientConfig = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'App',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  DEBUG: process.env.NEXT_PUBLIC_DEBUG || false,
};

export const serverConfig = {
  PORT: process.env.PORT || 3000,
  FEED_BACK_EMAIL: process.env.FEED_BACK_EMAIL,
  FEED_BACK_PASSWORD: process.env.FEED_BACK_PASSWORD,
  FEED_BACK_SERVICE: process.env.FEED_BACK_SERVICE,
  FEED_BACK_HOST: process.env.FEED_BACK_HOST,
  FEED_BACK_PORT: process.env.FEED_BACK_PORT,
};
