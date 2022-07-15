import config from '@/config';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import {Knex, knex as loadKnex} from 'knex';

const self: {db: Database, knex: Knex} = {
  db: null,
  knex: null,
};

export const db = self.db;
export const knex = self.knex;

export async function openDatabase(): Promise<Database> {
  if (self.db) {
    return self.db;
  }
  self.db = await open({
    filename: config.database.filename,
    driver: sqlite3.Database
  });
  return self.db;
}

export function openKnex(): Knex {
  if (self.knex) {
    return self.knex;
  }
  self.knex = loadKnex({
    client: 'sqlite3',
    connection: {
      filename: config.database.filename,
    },
    useNullAsDefault: true
  });
  return self.knex;
}

export async function closeDatabase(): Promise<void> {
  if (self.db) {
    return self.db.close().then(() => {
      self.db = null;
    });
  }
  return Promise.resolve();
}

export async function closeKnex(): Promise<void> {
  if (self.knex) {
    return self.knex.destroy().then(() => {
      self.knex = null;
    });
  }
  return Promise.resolve();
}