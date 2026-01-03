import  knex, { Knex } from 'knex';
import exitHook from 'async-exit-hook';
import { logInit, logShutdown } from './logger.ts';
import { toInt } from '../../shared/util/numberUtil.ts';
import Pool from 'pg-pool';
import { isEmpty, toBoolean } from '../../shared/util/genericUtil.ts';
import { isSiteModeDisabled } from '../loadenv.ts';

export type SaccharoseDb = {
  genshin: Knex,
  hsr: Knex,
  zenless: Knex,
  wuwa: Knex
}

let singleton: SaccharoseDb = null;
let pgSingleton: Knex = null;

export const pgSessionPool = new Pool({
  host:     ENV.POSTGRES_SITE_HOST,
  database: ENV.POSTGRES_SITE_DATABASE,
  user:     ENV.POSTGRES_SITE_USER,
  password: ENV.POSTGRES_SITE_PASSWORD,
  port:     toInt(ENV.POSTGRES_SITE_PORT, 5432),
});

function pgSiteDatabase() {
  return knex({
    client: 'pg',
    connection: {
      host:     ENV.POSTGRES_SITE_HOST,
      database: ENV.POSTGRES_SITE_DATABASE,
      user:     ENV.POSTGRES_SITE_USER,
      password: ENV.POSTGRES_SITE_PASSWORD,
      port:     toInt(ENV.POSTGRES_SITE_PORT, 5432),
    },
    pool: {
      max: 100,
    },
    useNullAsDefault: true,
  });
}

function pgGamedataDatabase(db: string) {
  if (isEmpty(db)) {
    throw 'Database name is required!';
  }
  return knex({
    client: 'pg',
    connection: {
      host:     ENV.POSTGRES_GAMEDATA_HOST,
      database: db,
      user:     ENV.POSTGRES_GAMEDATA_USER,
      password: ENV.POSTGRES_GAMEDATA_PASSWORD,
      port:     toInt(ENV.POSTGRES_GAMEDATA_PORT, 5432),
    },
    pool: {
      max: 30,
    },
    useNullAsDefault: true,
  });
}

export function openPgGamedata(): SaccharoseDb {
  if (singleton) {
    return singleton;
  }
  singleton = {
    genshin:  isSiteModeDisabled('genshin') ? null  : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_GENSHIN),
    hsr:      isSiteModeDisabled('hsr') ? null      : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_HSR),
    zenless:  isSiteModeDisabled('zenless') ? null  : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_ZENLESS),
    wuwa:     isSiteModeDisabled('wuwa') ? null     : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_WUWA),
  };
  return singleton;
}

export function openPgSite(): Knex {
  if (pgSingleton) {
    return pgSingleton;
  }
  pgSingleton = pgSiteDatabase();
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

let didEnableDbExitHook = false;

export function enableDbExitHook() {
  if (didEnableDbExitHook) {
    return;
  }
  didEnableDbExitHook = true;
  logInit('Enabling database exit hook...');
  exitHook(callback => {
    console.log('Exit signal received, closing database...');
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
