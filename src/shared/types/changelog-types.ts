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
  version: string,
  excelFile: string,
  recordKey: string,
  record: ChangeRecord
}

export type TextMapChangeRef = {
  version: string,
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

// region TextMap Changelog Types
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

export type TextMapChangesAsRows = {
  langCode: LangCode,
  added: TextMapChangeAddRow[],
  removed: TextMapChangeRemoveRow[],
  updated: TextMapChangeUpdateRow[]
}

export function textMapChangesAsRows(input: TextMapChanges,
                                     normFunction: ((s: string) => string) = ((s) => s)): TextMapChangesAsRows {
  const out: TextMapChangesAsRows = {
    langCode: input.langCode,
    added: [],
    removed: [],
    updated: [],
  };

  for (let [textMapHash, text] of Object.entries(input.added)) {
    text = normFunction(text);
    out.added.push({ textMapHash, text });
  }
  for (let [textMapHash, text] of Object.entries(input.removed)) {
    text = normFunction(text);
    out.removed.push({ textMapHash, text });
  }
  for (let [textMapHash, text] of Object.entries(input.updated)) {
    let newText = text.newValue;
    let oldText = text.oldValue;

    newText = normFunction(newText);
    oldText = normFunction(oldText);

    out.updated.push({ textMapHash, oldText, newText });
  }
  return out;
}

export type TextMapChangeAddRow = {
  textMapHash: TextMapHash,
  text: string,
}
export type TextMapChangeUpdateRow = {
  textMapHash: TextMapHash,
  oldText: string,
  newText: string,
}
export type TextMapChangeRemoveRow = {
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

export type FullChangelog = {
  version: GameVersion,
  textmapChangelog: TextMapFullChangelog,
  excelChangelog: ExcelFullChangelog,
}
