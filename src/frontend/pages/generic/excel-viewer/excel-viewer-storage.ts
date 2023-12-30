import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ColumnState } from 'ag-grid-community';

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
  }
}

export async function invokeExcelViewerDB<T = void>(callback: (db: IDBPDatabase<ExcelViewerDB>) => Promise<T>|void): Promise<T> {
  const db = await openDB<ExcelViewerDB>('ExcelViewer', 1, {
    upgrade(db) {
      db.createObjectStore('GENSHIN.ColumnState');
      db.createObjectStore('HSR.ColumnState');
      db.createObjectStore('ZENLESS.ColumnState');
    }
  });

  const result: T = (await callback(db)) as T;

  db.close();

  return result;
}
