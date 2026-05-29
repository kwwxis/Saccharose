import { LangCode, TextMapHash } from './lang-types.ts';
import { GameVersion } from './game-versions.ts';
import { defaultMap } from '../util/genericUtil.ts';
import { sort } from '../util/arrayUtil.ts';

export type ChangeType = 'added' | 'updated' | 'removed' | 'superseded';

// region Excel Changelog Types
// --------------------------------------------------------------------------------------------------------------
export type ExcelChangeEntity = {
  excel_file: string;
  version: string;
  key: string;
  change_type: string;
  json: ExcelChangeRecord;
};

export function toExcelChangeEntity(changeRecord: ExcelChangeRecord): ExcelChangeEntity {
  return {
    excel_file: changeRecord.excelFile,
    version: changeRecord.versionNumber,
    key: changeRecord.key,
    change_type: changeRecord.changeType,
    json: changeRecord._metadataOnly ? null : changeRecord,
  };
}

export function toExcelChangeRecord(changeEntity: ExcelChangeEntity): ExcelChangeRecord {
  if (changeEntity.json) {
    return changeEntity.json;
  } else {
    return {
      versionNumber: changeEntity.version,
      excelFile: changeEntity.excel_file,
      key: changeEntity.key,
      changeType: changeEntity.change_type as ChangeType,
      _metadataOnly: true,
    };
  }
}

export type ExcelChangeRecord = {
  /**
   * Version number.
   */
  versionNumber: string;

  /**
   * Name of the Excel file.
   */
  excelFile: string;

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
  updatedFields?: { [field: string]: ExcelFieldChange },

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

  _metadataOnly?: boolean,
};

export type ExcelFieldChange = {
  field: string,
  oldValue?: string,
  newValue?: string,
  textChanges?: {
    langCode: LangCode,
    oldValue?: string,
    newValue?: string
  }[];
};

export type ExcelChangeRef = ExcelChangeRecord & {
  version: GameVersion,
}
// endregion

// region Excel: Combined JSON
// --------------------------------------------------------------------------------------------------------------
export type ExcelVersionChangelog = Record<string, ExcelFileChanges>;

export type ExcelFileChanges = {
  name: string;
  version: string;
  changedRecords: Record<string, ExcelChangeRecord>;
};

export function buildExcelFullChangelog(
  records: ExcelChangeRecord[],
  gameVersion: GameVersion,
): ExcelVersionChangelog {
  const changelog: ExcelVersionChangelog = defaultMap(excelName => ({
    name: excelName,
    version: gameVersion.number,
    changedRecords: {}
  }));

  for (const record of records) {
    changelog[record.excelFile].changedRecords[record.key] = record;
  }

  return changelog;
}
// endregion

// region TextMap: Entity and Ref
// --------------------------------------------------------------------------------------------------------------
export type TextMapChangeEntity = {
  version: string,
  lang_code: LangCode,
  hash: TextMapHash,
  agg_id: string,
  change_type: ChangeType,
  prev_hash?: TextMapHash, // only if change_type = 'superseded'
  content?: string,
  prev_content?: string,
};

export type TextMapHashAggEntity = {
  hash: TextMapHash;
  agg_id: string;
};

export type TextMapChangeRef = {
  aggId: string,
  hash: TextMapHash,
  version: GameVersion,
  changeType: ChangeType,
  value?: string,
  prevValue?: string,
  prevHash?: TextMapHash,
}

export class TextMapChangeRefs {
  constructor(readonly list: TextMapChangeRef[]) {}

  get firstAdded(): TextMapChangeRef {
    return this.list.find(ref => ref.changeType === 'added') || null;
  }

  add(ref: TextMapChangeRef): void {
    this.list.push(ref);
  }

  ensureSorted() {
    sort(this.list, '-version.idxOrder');
  }
}

export class TextMapMultiChangeRefs {
  private hashToAggId: Record<TextMapHash, string> = {};
  private aggToChangeRefs: Record<string, TextMapChangeRefs> = defaultMap(() => new TextMapChangeRefs([]));

  add(changeRef: TextMapChangeRef): void {
    this.hashToAggId[changeRef.hash] = changeRef.aggId;
    this.aggToChangeRefs[changeRef.aggId].add(changeRef);
  }

  byAggId(aggId: string): TextMapChangeRefs {
    return this.aggToChangeRefs[aggId] || new TextMapChangeRefs([]);
  }

  byHash(hash: TextMapHash): TextMapChangeRefs {
    const aggId = this.hashToAggId[hash];
    return aggId ? this.byAggId(aggId) : new TextMapChangeRefs([]);
  }

  ensureSorted() {
    Object.values(this.aggToChangeRefs).forEach(changeRefs => changeRefs.ensureSorted());
  }
}
// endregion

// region TextMap: Combined JSON
// --------------------------------------------------------------------------------------------------------------
export type TextMapFullChangelog = Record<LangCode, TextMapChanges>;

export type TextMapChanges = {
  langCode: LangCode,
  added: Record<TextMapHash, string>,
  removed: Record<TextMapHash, string>,
  updated: Record<TextMapHash, TextMapContentChange>,
  superseded: Record<TextMapHash, TextMapHash>,
}

export type TextMapContentChange = {
  oldValue: string,
  newValue: string
}

// region TextMap: For Display
// --------------------------------------------------------------------------------------------------------------
export type TextMapChangesForDisplay = {
  langCode: LangCode,
  added: TextMapChangeAddDisplay[],
  removed: TextMapChangeRemoveDisplay[],
  updated: TextMapChangeUpdateDisplay[]
  superseded: TextMapChangeSupersedeDisplay[],
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
export type TextMapChangeSupersedeDisplay = {
  oldTextMapHash: TextMapHash,
  newTextMapHash: TextMapHash,
}
// endregion

// region Readable: Entity
// --------------------------------------------------------------------------------------------------------------
export type ReadableChange = {
  langCode: LangCode;
  name: string;
  locPath: string;
  version: string;
  contentHash: string;
  contentText: string;
}

export type ReadableChanges = {
  langCode: LangCode;
  list: ReadableChange[];
  byVersionNumber: Record<string, ReadableChange>;
  ranges: ReadableChangeRange[];
}

export type ReadableChangeRange = {
  startVersion: GameVersion,
  endVersion: GameVersion,
  prevContentVersion: GameVersion,
  prevContentText: string,
  contentText: string,
  contentHash: string,
};

export type ReadableChangesGroup = Record<LangCode, ReadableChanges>;

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

export interface ReadableChangedLocPath {
  locPath: string;
  langCode: string;
  name: string;
  oldContentHash: string;
  newContentHash: string;
}
// endregion
