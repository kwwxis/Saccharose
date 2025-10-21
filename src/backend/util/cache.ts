import exitHook from 'async-exit-hook';
import { createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts } from 'redis';
import { logInit, logShutdown } from './logger.ts';
import { toBoolean } from '../../shared/util/genericUtil.ts';
import { RespVersions, TypeMapping } from '@redis/client/dist/lib/RESP/types';
import { isArrayLike, toArray } from '../../shared/util/arrayUtil.ts';

const cache: {
  mode: 'memory' | 'redis',
  memory: {[key: string]: any}
  redis: RedisClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>,
  bufferRedis: RedisClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>,
} = {
  mode: 'memory',
  memory: {},
  redis: null,
  bufferRedis: null
};

export function redisClient(): RedisClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping> {
  return cache.redis;
}

export async function redisGetString(key: string): Promise<string> {
  return (await cache.redis.get(key))?.toString();
}

export async function redisSetString(key: string, value: string): Promise<void> {
  await cache.redis.set(key, value);
}

export async function redisDelPattern(pattern: string): Promise<void> {
  // SCANIterator returns an async iterator of keys (strings)
  const iterator = cache.redis.scanIterator({
    MATCH: pattern,
    COUNT: 1000,
  });

  const batch: string[] = [];
  const batchSize = 1000;

  for await (const keys of iterator) {
    for (let key of toArray(keys)) {
      batch.push(key.toString());
    }
    if (batch.length >= batchSize) {
      // console.log('Deleting keys: ', batch);
      await delcache(batch.splice(0, batch.length));
    }
  }

  // delete any remaining keys
  if (batch.length > 0) {
    // console.log('Deleting keys: ', batch);
    await delcache(batch);
  }
}

export async function delcache(keys: string|string[]) {
  if (!keys || !keys.length) {
    return;
  }

  await cache.redis.del(keys);

  if (typeof keys === 'string') {
    delete cache.memory[keys];
  } else {
    for (let key of keys) {
      delete cache.memory[key];
    }
  }
}

export async function cached(key: string, valueMode: 'string', supplierFn: (key?: string) => Promise<string>): Promise<string>
export async function cached(key: string, valueMode: 'boolean', supplierFn: (key?: string) => Promise<boolean>): Promise<boolean>
export async function cached<T>(key: string, valueMode: 'memory', supplierFn: (key?: string) => Promise<T>): Promise<T>
export async function cached<T>(key: string, valueMode: 'json', supplierFn: (key?: string) => Promise<T>): Promise<T>
export async function cached<T>(key: string, valueMode: 'set', supplierFn: (key?: string) => Promise<Set<T>>): Promise<Set<T>>
export async function cached<T>(key: string, valueMode: 'disabled', supplierFn: (key?: string) => Promise<T>): Promise<T>

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 */
export async function cached<T>(key: string,
                                valueMode: 'string' | 'json' | 'boolean' | 'memory' | 'set' | 'disabled',
                                supplierFn: (key?: string) => Promise<T>): Promise<T> {
  return _cachedImpl(key, valueMode, supplierFn);
}

export async function _cachedImpl<T>(key: string,
                                     valueMode: 'string' | 'json' | 'boolean' | 'memory' | 'set' | 'disabled',
                                     supplierFn: (key?: string) => Promise<T>): Promise<T> {
  if (valueMode === 'disabled') {
    return await supplierFn(key);
  }
  if (typeof cache.memory[key] !== 'undefined') {
    return cache.memory[key];
  }
  if (valueMode === 'memory' || cache.mode === 'memory') {
    cache.memory[key] = await supplierFn(key);
    return cache.memory[key];
  } else {
    if (await cache.redis.exists(key)) {
      let value: any;

      switch (valueMode) {
        case 'string': {
          value = await cache.redis.get(key);
          break;
        }
        case 'set': {
          const raw: string = (await cache.redis.get(key)).toString();
          value = JSON.parse(raw);
          if (Array.isArray(value)) {
            value = new Set(value);
          } else {
            value = null;
          }
          break;
        }
        case 'json':
        case 'boolean': {
          const raw: string = (await cache.redis.get(key)).toString();
          value = JSON.parse(raw);
          break;
        }
      }

      cache.memory[key] = value;
      return value;
    } else {
      let raw: T = await supplierFn(key);
      cache.memory[key] = raw;

      let value: string|Buffer;
      switch (valueMode) {
        case 'string': {
          value = typeof raw === 'string' ? raw : String(raw);
          break;
        }
        case 'set': {
          if (raw instanceof Set) {
            value = JSON.stringify(Array.from(raw));
          } else {
            value = null;
          }
          break;
        }
        case 'json':
        case 'boolean': {
          value = JSON.stringify(raw);
          break;
        }
      }

      await cache.redis.set('LastDoSet', key);
      await cache.redis.set(key, value);

      return raw;
    }
  }
}

export async function openRedisClient() {
  if (!toBoolean(ENV.REDIS_ENABLED)) {
    logInit('Redis client not enabled.');
    return;
  }

  logInit('Starting redis client.');

  cache.mode = 'redis';

  cache.redis = await createClient({
    url: ENV.REDIS_URL,
    socket: {
      keepAlive: true,
      noDelay: true,
      reconnectStrategy: retries => Math.min(retries * 50, 1000),
    },
    pingInterval: 30_000
  })
    .on('error', err => console.error('Redis Client Error', err))
    .connect();
}

export function enableRedisExitHook() {
  exitHook(callback => {
    if (!cache.redis) {

    }
    logShutdown('Exit signal received, closing Redis client...');
    cache.redis.disconnect().then(() => {
      logShutdown('Successfully closed Redis client.');
      callback();
    });
  });
}
