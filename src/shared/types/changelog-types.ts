import { LangCode, TextMapHash } from './lang-types.ts';
import { defaultMap } from '../util/genericUtil.ts';
import { toString } from '../util/stringUtil.ts';

// region Excel Changelog Types
// --------------------------------------------------------------------------------------------------------------
export type ExcelFullChangelog = Record<string, ExcelFileChanges>;

export type ExcelFileChanges = {
  name: string;
  changedRecords: ChangeRecordMap;
};

export type ChangeRecordMap = {
  [key: string]: ChangeRecord
}

export type ChangeType = 'added' | 'updated' | 'removed';

export type ChangeRecord = {
  /**
   * The primary key of the record that was changed.
   */
  key: string,

  /**
   * The change type of the overall record.
   */
  changeType: ChangeType,

  /**
   * Changes to the fields of the record.
   *
   * Fields that weren't changed will not be included here.
   *
   * (This property is set only when `changeType=updated`)
   */
  updatedFields: { [field: string]: FieldChange },

  /**
   * The recorded that was added.
   *
   * (This property is set only when `changeType=added`)
   */
  addedRecord?: any,

  /**
   * The record that was removed.
   *
   * (This property is set only when `changeType=removed`)
   */
  removedRecord?: any,
};

export type FieldChange = {
  field: string,
  oldValue?: string,
  newValue?: string,
  textChanges?: {
    langCode: LangCode,
    oldValue?: string,
    newValue?: string
  }[];
};
// endregion

// region TextMap Changelog Types
// --------------------------------------------------------------------------------------------------------------
export type TextMapFullChangelog = Record<LangCode, TextMapChanges>;

export type TextMapChanges = {
  langCode: LangCode,
  added: Record<TextMapHash, string>,
  removed: Record<TextMapHash, string>,
  updated: Record<TextMapHash, { oldValue: string, newValue: string }>
}
// endregion

// region Utility Functions
// --------------------------------------------------------------------------------------------------------------
export function newChangeRecord(key: string|number): ChangeRecord {
  return {
    key: toString(key),
    changeType: undefined,
    updatedFields: defaultMap(field => ({
      field: toString(field)
    }))
  };
}

export function newChangeRecordMap(): ChangeRecordMap {
  return defaultMap(key => newChangeRecord(key));
}
// endregion
