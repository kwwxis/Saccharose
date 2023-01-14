import  knex, { Knex } from 'knex';
import exitHook from 'async-exit-hook';
import path from 'path';
import { DATAFILE_SQLITE_DB } from '../loadenv';

let singleton: Knex = null;

export function openKnex(): Knex {
  if (singleton) {
    return singleton;
  }
  singleton = knex({
    client: 'sqlite3',
    connection: {
      filename: path.resolve(process.env.GENSHIN_DATA_ROOT, DATAFILE_SQLITE_DB),
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: function(conn, done) {
        conn.run('PRAGMA journal_mode = off;', function() {
          conn.run('PRAGMA synchronous = 0;', done);
        });
      }
    }
  });
  return singleton;
}

export async function closeKnex(): Promise<boolean> {
  if (singleton) {
    return singleton.destroy().then(() => {
      singleton = null;
      return true;
    });
  }
  return Promise.resolve(false);
}

exitHook(callback => {
  console.log('Exit signal received, closing database...')
  closeKnex().then(b => {
    if (b) {
      console.log('Successfully closed database.');
    } else {
      console.log('Database already closed.');
    }
    callback();
  })
});