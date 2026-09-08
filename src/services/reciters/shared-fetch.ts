// Type-only DOM global; derive it from fetch's signature to satisfy ESLint no-undef.
type FetchOptions = Parameters<typeof fetch>[1];

export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000,
  init?: FetchOptions
): Promise<Response> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return Promise.race([
    init === undefined ? fetch(url) : fetch(url, init),
    new Promise<Response>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Fetch timeout')),
        timeoutMs
      );
    }),
  ]).finally(() => clearTimeout(timeoutId));
};

const defaultDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export type DelayFunction = (_ms: number) => Promise<void>;

export const retryFetch = async (
  url: string,
  maxAttempts = 3,
  delayFunction: DelayFunction = defaultDelay,
  init?: FetchOptions
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let index = 0; index < maxAttempts; index++) {
    try {
      const response = await fetchWithTimeout(url, 10_000, init);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delayFunction(2 ** index * 1000);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
};
