import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StoreNames } from 'idb/build/entry';
import SiteMode from '../core/userPreferences/siteMode.ts';
import { SearchMode } from '../../shared/util/searchUtil.ts';

const MAX_RECENT_SEARCHES = 100;
const MAX_TO_SHOW = 7;

export interface RecentSearch {
  query: string,
  searchMode: SearchMode,
}

interface RecentSearchesDB extends DBSchema {
  'GENSHIN.RecentSearches': {
    key: string,
    value: RecentSearch[]
  },
  'HSR.RecentSearches': {
    key: string,
    value: RecentSearch[]
  },
  'ZENLESS.RecentSearches': {
    key: string,
    value: RecentSearch[]
  },
  'WUWA.RecentSearches': {
    key: string,
    value: RecentSearch[]
  }
}

export async function invokeRecentSearchesDB<T = void>(callback: (db: IDBPDatabase<RecentSearchesDB>) => Promise<T>|void): Promise<T> {
  const db = await openDB<RecentSearchesDB>('RecentSearches', 1, {
    upgrade(db) {
      try {
        db.createObjectStore('GENSHIN.RecentSearches');
      } catch (ignore) {}

      try {
        db.createObjectStore('HSR.RecentSearches');
      } catch (ignore) {}

      try {
        db.createObjectStore('ZENLESS.RecentSearches');
      } catch (ignore) {}

      try {
        db.createObjectStore('WUWA.RecentSearches');
      } catch (ignore) {}
    }
  });

  const result: T = (await callback(db)) as T;

  db.close();

  return result;
}

export class RecentSearchesHandle {
  cache: RecentSearch[] = null;

  constructor(readonly key: string, readonly service: RecentSearchesService) {
  }

  async all(): Promise<RecentSearch[]> {
    if (this.cache != null)
      return this.cache;
    return this.service.all(this.key);
  }

  async add(search: RecentSearch): Promise<void> {
    await this.service.add(this.key, search);
  }

  async filter(query: string): Promise<RecentSearch[]> {
    const searches = await this.all();
    let results: RecentSearch[] = [];
    for (let search of searches) {
      if (search.query.toLowerCase().startsWith(query.toLowerCase())) {
        results.push(search);
      }
      if (results.length >= MAX_TO_SHOW) {
        break;
      }
    }
    return results;
  }
}

export class RecentSearchesService {
  readonly storeName: StoreNames<RecentSearchesDB> = `${SiteMode.storagePrefix}.RecentSearches`;
  private activeHandles: Map<string, RecentSearchesHandle> = new Map();

  constructor() {
  }

  handle(key: string): RecentSearchesHandle {
    if (this.activeHandles.has(key)) {
      return this.activeHandles.get(key);
    } else {
      const handle = new RecentSearchesHandle(key, this);
      this.activeHandles.set(key, handle);
      return handle;
    }
  }

  async all(key: string): Promise<RecentSearch[]> {
    return invokeRecentSearchesDB(async db => {
      const searches = await db.get(this.storeName, key);
      this.handle(key).cache = searches;
      return searches;
    });
  }

  async add(key: string, search: RecentSearch): Promise<void> {
    await invokeRecentSearchesDB(async db => {
      const searches = await db.get(this.storeName, key);
      searches.unshift(search);
      searches.splice(MAX_RECENT_SEARCHES);
      this.handle(key).cache = searches;
      await db.put(this.storeName, searches, key);
    });
  }

  async save(key: string, searches: RecentSearch[]): Promise<void> {
    await invokeRecentSearchesDB(db => {
      searches.splice(MAX_RECENT_SEARCHES);
      this.handle(key).cache = searches;
      db.put(this.storeName, searches, key);
    });
  }
}

export const RecentSearches = new RecentSearchesService();
