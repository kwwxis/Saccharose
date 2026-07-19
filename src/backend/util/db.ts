import  knex, { Knex } from 'knex';
import exitHook from 'async-exit-hook';
import { logInit, logShutdown } from './logger.ts';
import { toInt } from '../../shared/util/numberUtil.ts';
import Pool from 'pg-pool';
import { isEmpty } from '../../shared/util/genericUtil.ts';
import { isServerRun, isSiteModeDisabled } from '../loadenv.ts';

export type SaccharoseDb = {
  genshin: Knex,
  hsr: Knex,
  zenless: Knex,
  wuwa: Knex
}

let gameDataSingleton: SaccharoseDb = null;
let siteDataSingleton: Knex = null;

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
    if (isServerRun()) {
      throw 'Database name is required!';
    } else {
      return null;
    }
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
  if (gameDataSingleton) {
    return gameDataSingleton;
  }
  gameDataSingleton = {
    genshin:  isSiteModeDisabled('genshin') ? null  : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_GENSHIN),
    hsr:      isSiteModeDisabled('hsr') ? null      : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_HSR),
    zenless:  isSiteModeDisabled('zenless') ? null  : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_ZENLESS),
    wuwa:     isSiteModeDisabled('wuwa') ? null     : pgGamedataDatabase(ENV.POSTGRES_GAMEDATA_DATABASE_WUWA),
  };
  return gameDataSingleton;
}

export function openPgSite(): Knex {
  if (siteDataSingleton) {
    return siteDataSingleton;
  }
  siteDataSingleton = pgSiteDatabase();
  return siteDataSingleton;
}

export async function closeKnex(): Promise<boolean> {
  const destroyPromises: Promise<void>[] = [];

  if (gameDataSingleton) {
    destroyPromises.push(... Object.values(gameDataSingleton)
      .filter(knex => !!knex)
      .map(knex => knex.destroy()));
  }

  if (siteDataSingleton) {
    destroyPromises.push(siteDataSingleton.destroy());
  }

  if (destroyPromises.length) {
    return Promise.all(destroyPromises).then(() => {
      gameDataSingleton = null;
      siteDataSingleton = null;
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
