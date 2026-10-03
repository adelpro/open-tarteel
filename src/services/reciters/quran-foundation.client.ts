import { fetchWithTimeout, retryFetch } from './shared-fetch';

const DEFAULT_TOKEN_URL = 'https://oauth2.quran.foundation/oauth2/token';
const DEFAULT_API_BASE = 'https://apis.quran.foundation';

export const CLIENT_ID_ENV_VAR = 'QURAN_FOUNDATION_CLIENT_ID';
export const CLIENT_SECRET_ENV_VAR = 'QURAN_FOUNDATION_CLIENT_SECRET';
export const TOKEN_URL_ENV_VAR = 'QURAN_FOUNDATION_TOKEN_URL';
export const API_BASE_ENV_VAR = 'QURAN_FOUNDATION_API_BASE';
export const RATE_LIMIT_MS_ENV_VAR = 'QURAN_FOUNDATION_RATE_LIMIT_MS';

const DEFAULT_RATE_LIMIT_MS = 1100;

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let cachedToken: { value: string; expiresAt: number } | null = null;

export const resetQuranFoundationClientCache = (): void => {
  cachedToken = null;
};

export const getQfEnvironmentVariable = (name: string): string | undefined =>
  process.env[name];

const readEnvironment = (name: string): string => {
  const value = getQfEnvironmentVariable(name);
  if (!value) {
    throw new Error(
      `${name} is not set; quran.foundation provider is disabled`
    );
  }
  return value;
};

const rateLimitMs = (): number => {
  const override = Number(getQfEnvironmentVariable(RATE_LIMIT_MS_ENV_VAR));
  return Number.isFinite(override) && override >= 0
    ? override
    : DEFAULT_RATE_LIMIT_MS;
};

const noop = (): Promise<void> => Promise.resolve();

const fetchFreshToken = async (
  tokenUrl: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in?: number }> => {
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );
  let response: Response;
  try {
    response = await retryFetch(tokenUrl, 3, rateLimitMs() > 0 ? delay : noop, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: 'grant_type=client_credentials&scope=content',
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to fetch quran.foundation access token (${reason})`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error('quran.foundation token response missing access_token');
  }
  return { access_token: data.access_token, expires_in: data.expires_in };
};

export const getAccessToken = async (forceRefresh = false): Promise<string> => {
  if (
    !forceRefresh &&
    cachedToken &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.value;
  }

  const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
  const clientSecret = readEnvironment(CLIENT_SECRET_ENV_VAR);
  const tokenUrl =
    getQfEnvironmentVariable(TOKEN_URL_ENV_VAR) ?? DEFAULT_TOKEN_URL;

  const data = await fetchFreshToken(tokenUrl, clientId, clientSecret);
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
  };

  return data.access_token;
};

export async function qfFetch(
  path: string,
  options?: Parameters<typeof fetch>[1] & { disablePacing?: boolean }
): Promise<Response> {
  const apiBase =
    getQfEnvironmentVariable(API_BASE_ENV_VAR) ?? DEFAULT_API_BASE;
  const clientId = readEnvironment(CLIENT_ID_ENV_VAR);
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;

  const { disablePacing, ...fetchOptions } = options ?? {};
  const intervalMs = disablePacing ? 0 : rateLimitMs();
  const backoff = intervalMs > 0 ? delay : noop;

  let currentToken = await getAccessToken();
  let lastError: Error | null = null;
  const maxAttempts = 3;

  for (let index = 0; index < maxAttempts; index++) {
    try {
      const headers = new Headers(fetchOptions.headers);
      headers.set('x-auth-token', currentToken);
      headers.set('x-client-id', clientId);

      const headersObject: Record<string, string> = {};
      for (const [key, value] of headers.entries()) {
        headersObject[key] = value;
      }

      const response = await fetchWithTimeout(url, 10_000, {
        ...fetchOptions,
        headers: headersObject,
      });

      if (response.status === 401) {
        currentToken = await getAccessToken(true);
        lastError = new Error(`HTTP 401`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (intervalMs > 0) {
        await delay(intervalMs);
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await backoff(2 ** index * 1000);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
}
