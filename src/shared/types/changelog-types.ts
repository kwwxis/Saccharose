import { LangCode, TextMapHash } from './lang-types.ts';
import { defaultMap } from '../util/genericUtil.ts';
import { toString } from '../util/stringUtil.ts';
import { GameVersion } from './game-versions.ts';

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

export type ChangeRecordRef = {
  version: GameVersion,
  excelFile: string,
  recordKey: string,
  record: ChangeRecord
}

export type TextMapChangeRef = {
  version: GameVersion,
  changeType: ChangeType,
  value: string,
  prevValue?: string,
}

export class TextMapChangeRefs {
  constructor(readonly list: TextMapChangeRef[]) {}

  get firstAdded() {
    return this.list.find(ref => ref.changeType === 'added') || null;
  }
}
// endregion

// region TextMap Changelog Types: Database Entity
// --------------------------------------------------------------------------------------------------------------
export type TextMapChangeEntity = {
  version: string,
  lang_code: LangCode,
  hash: TextMapHash,
  change_type: ChangeType,
  content?: string,
  prev_content?: string,
};
// endregion

// region TextMap Changelog Types: JSON File
// --------------------------------------------------------------------------------------------------------------
export type TextMapFullChangelog = Record<LangCode, TextMapChanges>;

export type TextMapChanges = {
  langCode: LangCode,
  added: Record<TextMapHash, string>,
  removed: Record<TextMapHash, string>,
  updated: Record<TextMapHash, TextMapContentChange>
}

export type TextMapContentChange = {
  oldValue: string,
  newValue: string
}

// region TextMap Changelog Types: For Display
// --------------------------------------------------------------------------------------------------------------
export type TextMapChangesForDisplay = {
  langCode: LangCode,
  added: TextMapChangeAddDisplay[],
  removed: TextMapChangeRemoveDisplay[],
  updated: TextMapChangeUpdateDisplay[]
}
export type TextMapChangeAddDisplay = {
  textMapHash: TextMapHash,
  text: string,
}
export type TextMapChangeUpdateDisplay = {
  textMapHash: TextMapHash,
  oldText: string,
  newText: string,
}
export type TextMapChangeRemoveDisplay = {
  textMapHash: TextMapHash,
  text: string,
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

// region Readable Changelog Type: Entity
// --------------------------------------------------------------------------------------------------------------
export type ReadableChange = {
  langCode: LangCode;
  name: string;
  locPath: string;
  version: string;
  contentHash: string;
  contentText: string;
}

export type ReadableChangeEntity = {
  lang_code: LangCode;
  name: string;
  loc_path: string;
  version: string;
  content_hash: string;
}

export type ReadableContentEntity = {
  loc_path: string;
  content_hash: string;
  content_text: string;
}
// endregion
