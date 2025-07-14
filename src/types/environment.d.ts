declare namespace NodeJS {
  // eslint-disable-next-line unicorn/prevent-abbreviations
  interface ProcessEnv {
    //Public env:
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_TRACKER_URL: string;
    NEXT_PUBLIC_DEBUG: boolean;

    //Private env:
    PORT: number;
    DEBUG: boolean;

    FEED_BACK_EMAIL: string;
    FEED_BACK_PASSWORD: string;
    FEED_BACK_SERVICE: string;
    FEED_BACK_HOST: string;
    FEED_BACK_PORT: number;
  }
}
