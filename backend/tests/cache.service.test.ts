import { getCached, setCached, deleteCached, clearCache, getCacheStats, generateMetricsCacheKey } from '../src/services/cache.service';
import { initDatabase, closeDatabase } from '../src/database';

describe('Cache Service', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    clearCache();
  });

  describe('setCached and getCached', () => {
    it('should store and retrieve a cached value', () => {
      const value = { name: 'test', count: 42 };
      setCached('test-key', value);
      
      const retrieved = getCached<typeof value>('test-key');
      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent key', () => {
      const retrieved = getCached('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should handle different data types', () => {
      setCached('string', 'hello');
      setCached('number', 123);
      setCached('array', [1, 2, 3]);
      setCached('object', { a: 1, b: 2 });

      expect(getCached('string')).toBe('hello');
      expect(getCached('number')).toBe(123);
      expect(getCached('array')).toEqual([1, 2, 3]);
      expect(getCached('object')).toEqual({ a: 1, b: 2 });
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', () => {
      // Set with 0 second TTL (immediate expiration)
      setCached('expire-test', 'value', 0);
      
      // Wait a tiny bit for the timestamp to pass
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Wait 100ms
      }
      
      // Should be null after expiration
      expect(getCached('expire-test')).toBeNull();
    });
  });

  describe('deleteCached', () => {
    it('should delete a cached value', () => {
      setCached('delete-test', 'value');
      expect(getCached('delete-test')).toBe('value');
      
      deleteCached('delete-test');
      expect(getCached('delete-test')).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached values', () => {
      setCached('key1', 'value1');
      setCached('key2', 'value2');
      setCached('key3', 'value3');

      clearCache();

      expect(getCached('key1')).toBeNull();
      expect(getCached('key2')).toBeNull();
      expect(getCached('key3')).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      setCached('stat1', 'value1');
      setCached('stat2', 'value2');

      const stats = getCacheStats();
      expect(stats.total).toBe(2);
      expect(stats.valid).toBe(2);
      expect(stats.expired).toBe(0);
    });
  });

  describe('generateMetricsCacheKey', () => {
    it('should generate cache key for metrics', () => {
      const key = generateMetricsCacheKey('repo-123');
      expect(key).toBe('metrics:repo-123');
    });

    it('should include filters in cache key', () => {
      const key = generateMetricsCacheKey('repo-123', {
        start_time: 1000,
        end_time: 2000,
        author_id: 'author-1'
      });
      
      expect(key).toContain('metrics:repo-123');
      expect(key).toContain('start:1000');
      expect(key).toContain('end:2000');
      expect(key).toContain('author:author-1');
    });
  });
});
