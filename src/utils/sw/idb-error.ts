/**
 * Ensures Promise rejections always use an Error instance.
 */
export function toError(reason: unknown, fallback = 'IndexedDB error'): Error {
  if (reason instanceof Error) return reason;

  if (typeof reason === 'string') {
    return new Error(reason);
  }

  if (
    typeof reason === 'object' &&
    reason !== null &&
    'message' in reason &&
    typeof (reason as { message?: unknown }).message === 'string'
  ) {
    return new Error((reason as { message: string }).message);
  }

  return new Error(fallback);
}
