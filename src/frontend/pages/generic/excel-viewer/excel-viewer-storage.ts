import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ColumnState } from 'ag-grid-community';

export interface ExcelViewerDB extends DBSchema {
  'GENSHIN.ColumnState': {
    key: string,
    value: ColumnState[]
  },
  'HSR.ColumnState': {
    key: string,
    value: ColumnState[]
  },
  'ZENLESS.ColumnState': {
    key: string,
    value: ColumnState[]
  },
  'WUWA.ColumnState': {
    key: string,
    value: ColumnState[]
  }
}

export async function invokeExcelViewerDB<T = void>(callback: (db: IDBPDatabase<ExcelViewerDB>) => Promise<T>|void): Promise<T> {
  const db = await openDB<ExcelViewerDB>('ExcelViewer', 2, {
    upgrade(db) {
      try {
        db.createObjectStore('GENSHIN.ColumnState');
      } catch (ignore) {}

      try {
        db.createObjectStore('HSR.ColumnState');
      } catch (ignore) {}

      try {
        db.createObjectStore('ZENLESS.ColumnState');
      } catch (ignore) {}

      try {
        db.createObjectStore('WUWA.ColumnState');
      } catch (ignore) {}
    }
  });

  const result: T = (await callback(db)) as T;

  db.close();

  return result;
}
