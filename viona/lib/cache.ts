// File: lib/cache.ts
import { redis, CACHE_CONFIG, getCacheKey, getLastModifiedKey } from './redis';
import { Product } from '@/app/api/inventory/products/route';

export class CacheService {
  // Generic cache methods
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T | null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async setLastModified(resource: string, orgId: string): Promise<void> {
    const key = getLastModifiedKey(resource, orgId);
    const timestamp = Date.now();
    try {
      await redis.setex(key, CACHE_CONFIG.TTL.PRODUCTS * 2, timestamp); // Double TTL for last modified
    } catch (error) {
      console.error('Set last modified error:', error);
    }
  }

  static async getLastModified(resource: string, orgId: string): Promise<number | null> {
    const key = getLastModifiedKey(resource, orgId);
    try {
      const timestamp = await redis.get(key);
      return timestamp as number | null;
    } catch (error) {
      console.error('Get last modified error:', error);
      return null;
    }
  }

  // Product-specific cache methods
  static async getProducts(orgId: string): Promise<Product[] | null> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.PRODUCTS, orgId);
    return await this.get<Product[]>(key);
  }

  static async setProducts(orgId: string, products: Product[]): Promise<void> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.PRODUCTS, orgId);
    await this.set(key, products, CACHE_CONFIG.TTL.PRODUCTS);
    await this.setLastModified('products', orgId);
  }

  static async invalidateProducts(orgId: string): Promise<void> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.PRODUCTS, orgId);
    await this.del(key);
    await this.setLastModified('products', orgId);
  }

  // Organization cache methods
  static async getUserOrganizations(userId: string): Promise<any[] | null> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.USER_ORGS, userId);
    return await this.get<any[]>(key);
  }

  static async setUserOrganizations(userId: string, organizations: any[]): Promise<void> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.USER_ORGS, userId);
    await this.set(key, organizations, CACHE_CONFIG.TTL.ORGANIZATIONS);
  }

  static async invalidateUserOrganizations(userId: string): Promise<void> {
    const key = getCacheKey(CACHE_CONFIG.KEYS.USER_ORGS, userId);
    await this.del(key);
  }

  // Cache warming and batch operations
  static async warmupCache(orgId: string, products: Product[]): Promise<void> {
    await Promise.all([
      this.setProducts(orgId, products),
      // Add other cache warming operations here
    ]);
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const testKey = 'health-check';
      await redis.set(testKey, 'ok', { ex: 10 });
      const result = await redis.get(testKey);
      await redis.del(testKey);
      return result === 'ok';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  // Clear all cache (for debugging/maintenance)
  static async clearAll(): Promise<void> {
    try {
      const pattern = `${CACHE_CONFIG.VERSION}:*`;
      // Note: This is a simplified version. In production, use SCAN for large datasets
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Clear all cache error:', error);
    }
  }
}
