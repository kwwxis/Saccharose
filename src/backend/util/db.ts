import  knex, { Knex } from 'knex';
import exitHook from 'async-exit-hook';
import path from 'path';
import { DATAFILE_GENSHIN_SQLITE_DB, DATAFILE_HSR_SQLITE_DB, DATAFILE_ZENLESS_SQLITE_DB } from '../loadenv.ts';
import { logShutdown } from './logger.ts';
export type SaccharoseDb = {
  genshin: Knex,
  hsr: Knex,
  zenless: Knex,
}

let singleton: SaccharoseDb = null;

function createKnexConnection(dbFilePath: string): Knex {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: dbFilePath,
    },
    useNullAsDefault: true,
    pool: {
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

export function openKnex(): SaccharoseDb {
  if (singleton) {
    return singleton;
  }
  singleton = {
    genshin:  createKnexConnection(path.resolve(process.env.GENSHIN_DATA_ROOT,  DATAFILE_GENSHIN_SQLITE_DB)),
    hsr:      createKnexConnection(path.resolve(process.env.HSR_DATA_ROOT,      DATAFILE_HSR_SQLITE_DB)),
    zenless:  createKnexConnection(path.resolve(process.env.ZENLESS_DATA_ROOT,  DATAFILE_ZENLESS_SQLITE_DB)),
  };
  return singleton;
}

export async function closeKnex(): Promise<boolean> {
  if (singleton) {
    const destroyPromises: Promise<void>[] = Object.values(singleton)
      .filter(knex => !!knex)
      .map(knex => knex.destroy());
    if (destroyPromises.length) {
      return Promise.all(destroyPromises).then(() => {
        singleton = null;
        return true;
      });
    }
  }
  return Promise.resolve(false);
}

exitHook(callback => {
  logShutdown('Exit signal received, closing database...')
  closeKnex().then(b => {
    if (b) {
      logShutdown('Successfully closed database.');
    } else {
      logShutdown('Database already closed.');
    }
    callback();
  })
});