export const clientConfig = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'App',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  TRACKER_ONE_URL:
    process.env.NEXT_PUBLIC_TRACKER_ONE_URL || 'http://localhost:3001',
  TRACKER_TWO_URL:
    process.env.NEXT_PUBLIC_TRACKER_TWO_URL || 'http://localhost:3002',

  DEBUG: process.env.NEXT_PUBLIC_DEBUG || false,
};

export const serverConfig = {
  PORT: process.env.PORT || 3000,
  EXPRESSTURN_USERNAME: process.env.EXPRESSTURN_USERNAME,
  EXPRESSTURN_CREDENTIAL: process.env.EXPRESSTURN_CREDENTIAL,
  METERED_USERNAME: process.env.METERED_USERNAME,
  METERED_CREDENTIAL: process.env.METERED_CREDENTIAL,
  FEED_BACK_EMAIL: process.env.FEED_BACK_EMAIL,
  FEED_BACK_PASSWORD: process.env.FEED_BACK_PASSWORD,
  FEED_BACK_SERVICE: process.env.FEED_BACK_SERVICE,
  FEED_BACK_HOST: process.env.FEED_BACK_HOST,
  FEED_BACK_PORT: process.env.FEED_BACK_PORT,
};
