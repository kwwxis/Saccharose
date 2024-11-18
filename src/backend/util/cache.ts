import exitHook from 'async-exit-hook';
import { commandOptions, createClient, RedisClientType } from 'redis';
import { logInit, logShutdown } from './logger.ts';
import { RedisFunctions, RedisModules, RedisScripts } from '@redis/client/dist/lib/commands';
import { toBoolean } from '../../shared/util/genericUtil.ts';

const cache: {
  mode: 'memory' | 'redis',
  memory: {[key: string]: any}
  redis: RedisClientType<RedisModules, RedisFunctions, RedisScripts>,
} = {
  mode: 'memory',
  memory: {},
  redis: null
};

export function redisClient(): RedisClientType<RedisModules, RedisFunctions, RedisScripts> {
  return cache.redis;
}

export async function redisDelPattern(pattern: string): Promise<void> {
  let cursor: number = 0;
  do {
    const reply = await cache.redis.scan(cursor, { MATCH: pattern, COUNT: 1000 });
    await delcache(reply.keys);
    cursor = reply.cursor;
  } while (cursor);
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
export async function cached(key: string, valueMode: 'buffer', supplierFn: (key?: string) => Promise<Buffer>): Promise<Buffer>
export async function cached(key: string, valueMode: 'boolean', supplierFn: (key?: string) => Promise<boolean>): Promise<boolean>
export async function cached<T>(key: string, valueMode: 'memory', supplierFn: (key?: string) => Promise<T>): Promise<T>
export async function cached<T>(key: string, valueMode: 'json', supplierFn: (key?: string) => Promise<T>): Promise<T>
export async function cached<T>(key: string, valueMode: 'set', supplierFn: (key?: string) => Promise<Set<T>>): Promise<Set<T>>

/**
 * Get (and define if necessary) the value for the cache key. If the key is found, the value will
 * be returned. If the key is not found, the key will be created from the value returned by calling
 * `supplierFn` and that same value will be returned.
 */
export async function cached<T>(key: string,
                                valueMode: 'string' | 'buffer' | 'json' | 'boolean' | 'memory' | 'set',
                                supplierFn: (key?: string) => Promise<T>): Promise<T> {
  return _cachedImpl(key, valueMode, supplierFn);
}

export async function _cachedImpl<T>(key: string,
                                     valueMode: 'string' | 'buffer' | 'json' | 'boolean' | 'memory' | 'set',
                                     supplierFn: (key?: string) => Promise<T>): Promise<T> {
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
        case 'buffer': {
          const raw: Buffer = await cache.redis.get(commandOptions({ returnBuffers: true }), key);
          value = Buffer.isBuffer(raw) ? raw : null;
          break;
        }
        case 'set': {
          const raw: string = await cache.redis.get(key);
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
          const raw: string = await cache.redis.get(key);
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
        case 'buffer': {
          value = Buffer.isBuffer(raw) ? raw : null;
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

      await cache.redis.set(key, value);
      return raw;
    }
  }
}

export async function openRedisClient() {
  if (!toBoolean(process.env.REDIS_ENABLED)) {
    logInit('Redis client not enabled.');
    return;
  }

  logInit('Starting redis client.');

  cache.mode = 'redis';

  cache.redis = await createClient({
    url: process.env.REDIS_URL,
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
