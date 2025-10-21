// File: lib/redis.ts
import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
}

export const redis = Redis.fromEnv();

// Cache configuration
export const CACHE_CONFIG = {
  // Cache TTL in seconds
  TTL: {
    PRODUCTS: 60 * 15, // 15 minutes
    ORGANIZATIONS: 60 * 30, // 30 minutes
    USER_DATA: 60 * 10, // 10 minutes
  },
  
  // Cache key prefixes
  KEYS: {
    PRODUCTS: 'products',
    ORGANIZATIONS: 'organizations',
    USER_ORGS: 'user-organizations',
    ORG_MEMBERS: 'org-members',
    LAST_MODIFIED: 'last-modified',
  },
  
  // Cache version for invalidation
  VERSION: 'v1',
} as const;

// Helper functions for cache keys
export const getCacheKey = (prefix: string, ...identifiers: (string | number)[]) => {
  return `${CACHE_CONFIG.VERSION}:${prefix}:${identifiers.join(':')}`;
};

// Get last modified timestamp for data invalidation
export const getLastModifiedKey = (resource: string, orgId: string) => {
  return getCacheKey(CACHE_CONFIG.KEYS.LAST_MODIFIED, resource, orgId);
};
