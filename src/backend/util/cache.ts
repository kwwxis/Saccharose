import NodeCache from 'node-cache';

/**
 * Simple runtime cache. Not persistent across server shutdown/startups.
 */
const cache = new NodeCache();

export default cache;

export function delcache(keys: string|string[]) {
  return cache.del(keys);
}

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 *
 * @param {string} key the cache key
 * @param {(key: string, ttl_seconds: number) => Promise<T>} supplierFn a asynchronous function
 * that returns a new value for the key if the key is not found
 * @param {number} [ttl_seconds] redefines the TTL of the key. If the key is found, the key will be
 * updated to this TTL. If the key is not found, it'll be created with this TTL. Leave as undefined
 * if no TTL wanted.
 * @returns {Promise<T>} value for the key
 * @template T generic type
 */
export async function cached<T>(key: string, supplierFn: (key: string, ttl_seconds: number) => Promise<T>, ttl_seconds: number = undefined): Promise<T> {
  if (cache.ttl(key, ttl_seconds)) {
    return cache.get(key);
  } else {
    const val = await supplierFn(key, ttl_seconds);
    cache.set(key, val, ttl_seconds);
    return val;
  }
}

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 *
 * @param {string} key the cache key
 * @param {(key: string, ttl_seconds: number) => T} supplierFn a synchronous function that
 * returns a new value for the key if the key is not found
 * @param {number} [ttl_seconds] redefines the TTL of the key. If the key is found, the key will be
 * updated to this TTL. If the key is not found, it'll be created with this TTL. Leave as undefined
 * if no TTL wanted.
 * @returns {T} value for the key
 * @template T generic type
 */
export function cachedSync<T>(key: string, supplierFn: (key: string, ttl_seconds: number) => T, ttl_seconds: number = undefined): T {
  if (cache.ttl(key, ttl_seconds)) {
    return cache.get(key);
  } else {
    const val = supplierFn(key, ttl_seconds);
    cache.set(key, val, ttl_seconds);
    return val;
  }
}