/**
 * A bounded read of one Gun node.
 *
 * `.once()` on a path the relay has never seen does not always answer: the
 * callback can simply never fire. Login snapshots, schema stamps and settings
 * writes all used to sit behind that callback, so a fresh account could wait
 * forever. Resolve `null` after `timeout` instead, and let the caller decide
 * what "the relay has nothing" means.
 */
export function once<T = unknown>(
  node: any,
  timeout = 1500
): Promise<T | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: T | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeout);
    try {
      node.once((data: T) => {
        clearTimeout(timer);
        finish(data ?? null);
      });
    } catch {
      clearTimeout(timer);
      finish(null);
    }
  });
}
