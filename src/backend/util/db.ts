import  knex, { Knex } from 'knex';
import exitHook from 'async-exit-hook';
import path from 'path';
import { DATAFILE_GENSHIN_SQLITE_DB, DATAFILE_HSR_SQLITE_DB, DATAFILE_ZENLESS_SQLITE_DB, DATAFILE_WUWA_SQLITE_DB } from '../loadenv.ts';
import { logShutdown } from './logger.ts';
import { isInt, toInt } from '../../shared/util/numberUtil.ts';
import Pool from 'pg-pool';
import { toBoolean } from '../../shared/util/genericUtil.ts';

export type SaccharoseDb = {
  genshin: Knex,
  hsr: Knex,
  zenless: Knex,
  wuwa: Knex
}

let singleton: SaccharoseDb = null;
let pgSingleton: Knex = null;

function createSqliteConnection(dbFilePath: string): Knex {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: dbFilePath,
    },
    useNullAsDefault: true,
    pool: {
      max: 30,
      afterCreate: function(conn, done) {
        conn.run('PRAGMA journal_mode = WAL;', function() {
          conn.run('PRAGMA synchronous = normal;', function() {
            conn.run('PRAGMA temp_store = memory;', function() {
              conn.run('PRAGMA page_size = 32768;', done);
            })
          });
        });
      }
    }
  });
}

export const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: isInt(process.env.POSTGRES_PORT) ? toInt(process.env.POSTGRES_PORT) : 5432,
});

function createPostgresConnection() {
  if (!process.env.POSTGRES_HOST) {
    return null;
  }
  return knex({
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: isInt(process.env.POSTGRES_PORT) ? toInt(process.env.POSTGRES_PORT) : 5432,
    },
    pool: {
      max: 30,
    },
    useNullAsDefault: true,
  });
}

export function openSqlite(): SaccharoseDb {
  if (singleton) {
    return singleton;
  }
  singleton = {
    genshin:  toBoolean(process.env.GENSHIN_DISABLED) ? null  : createSqliteConnection(path.resolve(process.env.GENSHIN_DATA_ROOT,  DATAFILE_GENSHIN_SQLITE_DB)),
    hsr:      toBoolean(process.env.HSR_DISABLED) ? null      : createSqliteConnection(path.resolve(process.env.HSR_DATA_ROOT,      DATAFILE_HSR_SQLITE_DB)),
    zenless:  toBoolean(process.env.ZENLESS_DISABLED) ? null  : createSqliteConnection(path.resolve(process.env.ZENLESS_DATA_ROOT,  DATAFILE_ZENLESS_SQLITE_DB)),
    wuwa:     toBoolean(process.env.WUWA_DISABLED) ? null     : createSqliteConnection(path.resolve(process.env.WUWA_DATA_ROOT,     DATAFILE_WUWA_SQLITE_DB)),
  };
  return singleton;
}

export function openPg(): Knex {
  if (pgSingleton) {
    return pgSingleton;
  }
  pgSingleton = createPostgresConnection();
  return pgSingleton;
}

export async function closeKnex(): Promise<boolean> {
  const destroyPromises: Promise<void>[] = [];

  if (singleton) {
    destroyPromises.push(... Object.values(singleton)
      .filter(knex => !!knex)
      .map(knex => knex.destroy()));
  }

  if (pgSingleton) {
    destroyPromises.push(pgSingleton.destroy());
  }

  if (destroyPromises.length) {
    return Promise.all(destroyPromises).then(() => {
      singleton = null;
      pgSingleton = null;
      return true;
    });
  }
  return Promise.resolve(false);
}

export function enableDbExitHook() {
  exitHook(callback => {
    logShutdown('Exit signal received, closing database...')
    closeKnex().then(b => {
      if (b) {
        logShutdown('Successfully closed database.');
      } else {
        logShutdown('Database already closed.');
      }
      callback();
    });
  });
}
