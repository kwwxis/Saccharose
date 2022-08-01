import config from '@/config';
import {Knex, knex as loadKnex} from 'knex';
import exitHook from 'async-exit-hook';

let singleton: Knex = null;

export function openKnex(): Knex {
  if (singleton) {
    return singleton;
  }
  singleton = loadKnex({
    client: 'sqlite3',
    connection: {
      filename: config.database.filename,
    },
    useNullAsDefault: true
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