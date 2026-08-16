const AUTH_BASE_BY_ENV = {
  prelive: 'https://prelive-oauth2.quran.foundation',
  production: 'https://oauth2.quran.foundation',
} as const;

export const API_BASE_BY_ENV = {
  prelive: 'https://apis-prelive.quran.foundation',
  production: 'https://apis.quran.foundation',
} as const;

type QfEnvironment = keyof typeof AUTH_BASE_BY_ENV;

function getEnvironment(): QfEnvironment {
  const environment = process.env.QF_ENV ?? 'prelive';
  if (environment !== 'prelive' && environment !== 'production') {
    throw new Error(`Invalid QF_ENV: ${environment}`);
  }
  return environment;
}

export async function getQuranFoundationToken(): Promise<string> {
  const environment = getEnvironment();
  const clientId =
    process.env.QF_CLIENT_ID ?? process.env.QURAN_FOUNDATION_CLIENT_ID;
  const clientSecret =
    process.env.QF_CLIENT_SECRET ?? process.env.QURAN_FOUNDATION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('QF_CLIENT_ID / QF_CLIENT_SECRET missing');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  );

  const response = await fetch(
    `${AUTH_BASE_BY_ENV[environment]}/oauth2/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'content',
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`QF token request failed: ${response.status}`);
  }

  const data: { access_token: string; expires_in: number } =
    await response.json();
  return data.access_token;
}

export async function qfFetch(path: string): Promise<Response> {
  const environment = getEnvironment();
  const token = await getQuranFoundationToken();
  const clientId = process.env.QF_CLIENT_ID;

  const headers: Record<string, string> = {
    'x-auth-token': token,
  };
  if (clientId) {
    headers['x-client-id'] = clientId;
  }

  let response = await fetch(`${API_BASE_BY_ENV[environment]}${path}`, {
    headers,
    next: { revalidate: 3600 },
  });

  if (response.status === 401) {
    const freshToken = await getQuranFoundationToken();
    const retryHeaders: Record<string, string> = {
      'x-auth-token': freshToken,
    };
    if (clientId) {
      retryHeaders['x-client-id'] = clientId;
    }

    response = await fetch(`${API_BASE_BY_ENV[environment]}${path}`, {
      headers: retryHeaders,
      cache: 'no-store',
    });
  }

  return response;
}
