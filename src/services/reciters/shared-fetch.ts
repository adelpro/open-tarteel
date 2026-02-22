export const fetchWithTimeout = (
  url: string,
  timeoutMs = 10_000
): Promise<Response> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return Promise.race([
    fetch(url),
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

export const retryFetch = async (
  url: string,
  maxAttempts = 3,
  delayFunction: (ms: number) => Promise<void> = defaultDelay
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let index = 0; index < maxAttempts; index++) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await delayFunction(2 ** index * 1000);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  throw lastError!;
};
