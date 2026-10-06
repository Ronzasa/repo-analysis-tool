import { runQuery, getQuery } from '../database';

interface CacheEntry {
  key: string;
  value: string;
  created_at: number;
  expires_at: number;
}

const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Initialize cache table (called during database initialization)
 */
export function initializeCache(): void {
  // Cache table is created in database.ts during initialization
  // This function is kept for compatibility
}

/**
 * Get a cached value
 * @param key Cache key
 * @returns Cached value or null if not found/expired
 */
export function getCached<T>(key: string): T | null {
  const results = getQuery(
    'SELECT value, expires_at FROM cache WHERE key = ?',
    [key]
  );

  if (results.length === 0) {
    return null;
  }

  const entry = results[0] as any;
  const now = Math.floor(Date.now() / 1000);

  // Check if expired (using <= to handle edge case of TTL=0)
  if (entry.expires_at <= now) {
    // Remove expired entry
    runQuery('DELETE FROM cache WHERE key = ?', [key]);
    return null;
  }

  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cached value
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export function setCached<T>(key: string, value: T, ttl: number = DEFAULT_TTL): void {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ttl;
  const serialized = JSON.stringify(value);

  runQuery(
    'INSERT OR REPLACE INTO cache (key, value, created_at, expires_at) VALUES (?, ?, ?, ?)',
    [key, serialized, now, expiresAt]
  );
}

/**
 * Delete a cached value
 * @param key Cache key
 */
export function deleteCached(key: string): void {
  runQuery('DELETE FROM cache WHERE key = ?', [key]);
}

/**
 * Clear all cached values
 */
export function clearCache(): void {
  runQuery('DELETE FROM cache');
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Math.floor(Date.now() / 1000);
  runQuery('DELETE FROM cache WHERE expires_at < ?', [now]);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { total: number; expired: number; valid: number } {
  const now = Math.floor(Date.now() / 1000);
  
  const totalResults = getQuery('SELECT COUNT(*) as count FROM cache', []);
  const total = (totalResults[0] as any)?.count || 0;
  
  const expiredResults = getQuery('SELECT COUNT(*) as count FROM cache WHERE expires_at < ?', [now]);
  const expired = (expiredResults[0] as any)?.count || 0;
  
  return {
    total,
    expired,
    valid: total - expired
  };
}

/**
 * Generate a cache key for metrics
 */
export function generateMetricsCacheKey(
  repoId: string,
  filters?: {
    start_time?: number;
    end_time?: number;
    commit_hashes?: string[];
    author_id?: string;
  }
): string {
  const parts = [`metrics:${repoId}`];
  
  if (filters) {
    if (filters.start_time) parts.push(`start:${filters.start_time}`);
    if (filters.end_time) parts.push(`end:${filters.end_time}`);
    if (filters.commit_hashes) parts.push(`commits:${filters.commit_hashes.join(',')}`);
    if (filters.author_id) parts.push(`author:${filters.author_id}`);
  }
  
  return parts.join('|');
}

// Initialize cache on module load
initializeCache();
