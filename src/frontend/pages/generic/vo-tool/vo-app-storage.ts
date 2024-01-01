import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { StoreNames } from 'idb/build/entry';
import { LangCode } from '../../../../shared/types/lang-types.ts';
import { toInt } from '../../../../shared/util/numberUtil.ts';

export interface VoAppSavedAvatar {
  key: string,
  avatarId: number,
  wikitext: string,
  langCode: LangCode,
  lastUpdated: number,
}

export interface VoAppSavedAvatarTable {
  key: string,
  value: VoAppSavedAvatar
}

export interface VoAppSavedAvatarDatabase extends DBSchema {
  'GENSHIN.SavedAvatars': VoAppSavedAvatarTable,
  'HSR.SavedAvatars':     VoAppSavedAvatarTable,
  'ZENLESS.SavedAvatars': VoAppSavedAvatarTable,
}

export async function invokeVoAppSavedAvatarDb<T = void>(callback: (db: IDBPDatabase<VoAppSavedAvatarDatabase>) => Promise<T>|void): Promise<T> {
  const db = await openDB<VoAppSavedAvatarDatabase>('VoApp.SavedAvatars', 1, {
    upgrade(db) {
      db.createObjectStore('GENSHIN.SavedAvatars', {keyPath: 'key'});
      db.createObjectStore('HSR.SavedAvatars', {keyPath: 'key'});
      db.createObjectStore('ZENLESS.SavedAvatars', {keyPath: 'key'});
    }
  });

  const result: T = (await callback(db)) as T;

  db.close();

  return result;
}

export async function getAllVoAppSavedAvatars(storeName: StoreNames<VoAppSavedAvatarDatabase>): Promise<VoAppSavedAvatar[]> {
  return invokeVoAppSavedAvatarDb((db: IDBPDatabase<VoAppSavedAvatarDatabase>) => {
    return db.getAll(storeName);
  });
}

export async function getVoAppSavedAvatar(storeName: StoreNames<VoAppSavedAvatarDatabase>, key: string): Promise<VoAppSavedAvatar> {
  return await invokeVoAppSavedAvatarDb((db: IDBPDatabase<VoAppSavedAvatarDatabase>) => {
    return db.get(storeName, key);
  });
}

export async function putVoAppSavedAvatar(storeName: StoreNames<VoAppSavedAvatarDatabase>, data: Omit<VoAppSavedAvatar, 'key'>): Promise<void> {
  const dataToSave: VoAppSavedAvatar = Object.assign(data, {
    key: `${data.avatarId}_${data.langCode}`
  });
  await invokeVoAppSavedAvatarDb((db: IDBPDatabase<VoAppSavedAvatarDatabase>) => {
    db.put(storeName, dataToSave);
  });
}

export async function removeVoAppSavedAvatar(storeName: StoreNames<VoAppSavedAvatarDatabase>, key: string): Promise<void> {
  await invokeVoAppSavedAvatarDb((db: IDBPDatabase<VoAppSavedAvatarDatabase>) => {
    db.delete(storeName, key);
  });
}

export const VoAppStorageMigration = {
  needsMigration(): boolean {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('CHAR_VO_WIKITEXT')) {
        return true;
      }
    }
    return false;
  },
  async migrate(dryRun: boolean = false): Promise<void> {
    const avatarsToSave: {
      storeName: StoreNames<VoAppSavedAvatarDatabase>,
      localStorageKeys: string[],
      data: VoAppSavedAvatar,
    }[] = [];

    for (let i = 0; i < localStorage.length; i++){
      const key: string = localStorage.key(i);
      if (key.includes('_CHAR_VO_WIKITEXT_') && !key.endsWith('_UPDATETIME')) {
        const keyParts: string[] = key.split('_');
        const siteModePrefix: string = keyParts[0];
        const avatarId: number = toInt(keyParts.pop());
        const langCode: LangCode = keyParts.pop() as LangCode;

        const lastUpdatedTimeStr: string = localStorage.getItem(key+'_UPDATETIME');
        const lastUpdated: number = lastUpdatedTimeStr ? parseInt(lastUpdatedTimeStr) : 0;

        avatarsToSave.push({
          storeName: `${siteModePrefix}.SavedAvatars` as any,
          data: {
            key: `${avatarId}_${langCode}`,
            avatarId,
            langCode,
            lastUpdated,
            wikitext: localStorage.getItem(key)
          },
          localStorageKeys: [key, key + '_UPDATETIME']
        });
      }
    }

    console.log('[VO-App] Migration:', avatarsToSave);

    if (avatarsToSave.length && !dryRun) {
      await invokeVoAppSavedAvatarDb(db => {
        for (let item of avatarsToSave) {
          db.put(item.storeName, item.data);

          for (let localStorageKey of item.localStorageKeys) {
            localStorage.removeItem(localStorageKey);
          }
        }
      });
      location.reload();
    }
  }
};

