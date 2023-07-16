/**
 * Simple runtime cache. Not persistent across server shutdown/startups.
 */
const cache: {[key: string]: any} = {};

export function delcache(keys: string|string[]) {
  if (typeof keys === 'string') {
    delete cache[keys];
  } else {
    for (let key of keys) {
      delete cache[key];
    }
  }
}

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 */
export async function cached<T>(key: string, supplierFn: (key?: string) => Promise<T>): Promise<T> {
  if (typeof cache[key] !== 'undefined') {
    return cache[key];
  } else {
    cache[key] = await supplierFn(key);
    return cache[key];
  }
}

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 */
export function cachedSync<T>(key: string, supplierFn: (key?: string) => T): T {
  if (typeof cache[key] !== 'undefined') {
    return cache[key];
  } else {
    cache[key] = supplierFn(key);
    return cache[key];
  }
}