export interface CacheEntry<T = any, O = CacheOptions> {
  data: T;
  options: O;
  /** When this envelope was last written (for debugging) */
  cachedAt: number;
}
export interface CacheOptions {
  /** locale */
  locale: string;
  /** Absolute expiry timestamp (ms). After this, entry is stale. */
  ttl: number;
  /** If true, always fetch fresh regardless of TTL */
  forceRefresh: boolean;
  /** If fetch fails, keep old data (true) or clear it (false) */
  keepOnError: boolean;
  /**
   * Last time this reciter was opened/watched.
   * Updated on every visit — even if data didn't change.
   * Used to decide whether to refresh or drop on expiry:
   *   - within RECENT_ACTIVE_SPAN → try refresh, keep on fail
   *   - outside RECENT_ACTIVE_SPAN → remove from recent
   */
  lastConsumedAt: number;
}
