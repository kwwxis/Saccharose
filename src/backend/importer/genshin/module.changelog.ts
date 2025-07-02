import '../../loadenv.ts';
import { genshinSchema } from './genshin.schema.ts';
import { LangCode, TextMapHash } from '../../../shared/types/lang-types.ts';
import path from 'path';
import fs from 'fs';
import { defaultMap, isUnset } from '../../../shared/util/genericUtil.ts';
import { isEquiv, mapBy, resolveObjectPath, walkObject } from '../../../shared/util/arrayUtil.ts';
import { schemaPrimaryKey } from '../import_db.ts';
import {
  ChangeRecordMap,
  ExcelFullChangelog,
  newChangeRecordMap,
  TextMapFullChangelog,
} from '../../../shared/types/changelog-types.ts';
import { ltrim } from '../../../shared/util/stringUtil.ts';
import { GameVersion, GenshinVersions } from '../../../shared/types/game-versions.ts';

class CreateChangelogState {
  // Data Holders:
  // --------------------------------------------------------------------------------------------------------------
  public textmapChangelog: TextMapFullChangelog = defaultMap(langCode => ({
    langCode,
    added: {},
    removed: {},
    updated: {},
  }));

  public excelChangelog: ExcelFullChangelog = defaultMap(excelFileName => ({
    name: excelFileName,
    changedRecords: newChangeRecordMap()
  }));

  // Constants:
  // --------------------------------------------------------------------------------------------------------------
  readonly version: GameVersion;
  readonly versionLabel: string;
  readonly textmapChangelogFileName: string;
  readonly excelChangelogFileName: string;
  readonly prevDataRoot: string;
  readonly currDataRoot: string;

  // Composite Holders:
  // --------------------------------------------------------------------------------------------------------------
  readonly compositeTextMapHashAdded: Set<TextMapHash> = new Set<TextMapHash>();
  readonly compositeTextMapHashUpdated: Set<TextMapHash> = new Set<TextMapHash>();
  readonly compositeTextMapHashRemoved: Set<TextMapHash> = new Set<TextMapHash>();

  // Constructor:
  // --------------------------------------------------------------------------------------------------------------
  constructor(__versionLabel: string) {
    // Test environment variables:
    if (!process.env.GENSHIN_CHANGELOGS) {
      console.error('Must have GENSHIN_CHANGELOGS set in your .env!');
      process.exit(1);
    }
    if (!process.env.GENSHIN_ARCHIVES) {
      console.error('Must have GENSHIN_ARCHIVES set in your .env!');
      process.exit(1);
    }

    // Set version label:
    this.versionLabel = ltrim(__versionLabel.toLowerCase(), 'v');
    this.version = GenshinVersions.find(v => v.number == this.versionLabel);
    if (!this.version) {
      console.error('Invalid version: ' + this.versionLabel);
      process.exit(1);
    }

    // Set constants:
    this.textmapChangelogFileName = path.resolve(process.env.GENSHIN_CHANGELOGS, `./TextMapChangeLog.${this.versionLabel}.json`);
    this.excelChangelogFileName = path.resolve(process.env.GENSHIN_CHANGELOGS, `./ExcelChangeLog.${this.versionLabel}.json`);4

    this.prevDataRoot = path.resolve(process.env.GENSHIN_ARCHIVES, `./${this.version.previous}`);
    this.currDataRoot = path.resolve(process.env.GENSHIN_ARCHIVES, `./${this.version.number}`);

    // Initial message:
    console.info(`Creating changelog for ${this.version.previous} - ${this.version.number} diff`);
  }
}

async function computeTextMapChanges(state: CreateChangelogState) {
  if (fs.existsSync(state.textmapChangelogFileName)) {
    state.textmapChangelog = JSON.parse(fs.readFileSync(state.textmapChangelogFileName, {encoding: 'utf-8'}));
    console.log('Loaded TextMap changes from file.');
    return;
  }

  const { textmapChangelog, prevDataRoot, currDataRoot } = state;
  for (let schemaTable of Object.values(genshinSchema)) {
    if (!schemaTable.textMapSchemaLangCode) {
      continue;
    }

    const langCode: LangCode = schemaTable.textMapSchemaLangCode;
    console.log('Computing changes for TextMap' + langCode);

    let prevFile: string = path.resolve(prevDataRoot, schemaTable.jsonFile).replace(/\\/g, '/');
    let currFile: string = path.resolve(currDataRoot, schemaTable.jsonFile).replace(/\\/g, '/');

    if (!fs.existsSync(prevFile))
      prevFile = prevFile.replace(/\/TextMap([A-Z]+)\.json/, '/Text$1.json');
    if (!fs.existsSync(currFile))
      currFile = currFile.replace(/\/TextMap([A-Z]+)\.json/, '/Text$1.json');

    const prevData: Record<TextMapHash, string> = JSON.parse(fs.readFileSync(prevFile, {encoding: 'utf8'}));
    const currData: Record<TextMapHash, string> = JSON.parse(fs.readFileSync(currFile, {encoding: 'utf8'}));

    const addedHashes: Set<TextMapHash> = new Set(Object.keys(currData).filter(hash => !prevData[hash]));
    const removedHashes: Set<TextMapHash> = new Set(Object.keys(prevData).filter(hash => !currData[hash]));

    for (let addedHash of addedHashes) {
      textmapChangelog[langCode].added[addedHash] = currData[addedHash];
    }

    for (let removedHash of removedHashes) {
      textmapChangelog[langCode].removed[removedHash] = prevData[removedHash];
    }

    for (let [textMapHash, _textMapContent] of Object.entries(currData)) {
      if (addedHashes.has(textMapHash) || removedHashes.has(textMapHash)) {
        continue;
      }
      if (currData[textMapHash] !== prevData[textMapHash]) {
        textmapChangelog[langCode].updated[textMapHash] = {
          oldValue: prevData[textMapHash],
          newValue: currData[textMapHash]
        };
      }
    }
  }

  fs.writeFileSync(state.textmapChangelogFileName, JSON.stringify(textmapChangelog, null, 2), {
    encoding: 'utf-8'
  });
  console.log('Finished computing TextMap changes.');
}

async function computeTextMapComposites(state: CreateChangelogState) {
  for (let textMapChanges of Object.values(state.textmapChangelog)) {
    Object.keys(textMapChanges.added).forEach(hash => state.compositeTextMapHashAdded.add(hash));
    Object.keys(textMapChanges.updated).forEach(hash => state.compositeTextMapHashUpdated.add(hash));
    Object.keys(textMapChanges.removed).forEach(hash => state.compositeTextMapHashRemoved.add(hash));
  }
}

async function computeExcelFileChanges(state: CreateChangelogState) {
  if (fs.existsSync(state.excelChangelogFileName)) {
    state.excelChangelog = JSON.parse(fs.readFileSync(state.excelChangelogFileName, {encoding: 'utf-8'}));
    console.log('Loaded Excel File changes from file.');
    return;
  }

  const { compositeTextMapHashUpdated, prevDataRoot, currDataRoot } = state;

  for (let schemaTable of Object.values(genshinSchema)) {
    // Skip tables we don't care about:
    if (schemaTable.name.startsWith('Relation_') || schemaTable.name.startsWith('PlainLineMap') || schemaTable.name.startsWith('TextMap')
      || schemaTable.name === 'CodexQuestExcelConfigData' || schemaTable.name === 'DialogExcelConfigData'
      || schemaTable.name === 'TalkExcelConfigData' || schemaTable.name === 'DialogUnparentedExcelConfigData' || schemaTable.name === 'QuestExcelConfigData') {
      continue;
    }

    // Get the primary key of the table:
    const primaryKey: string = schemaPrimaryKey(schemaTable);

    // If the table doesn't have a primary key, then we are unable to compute its diff. So it has to be skipped:
    if (!primaryKey) {
      continue;
    }

    const prevFilePath: string = path.resolve(prevDataRoot, schemaTable.jsonFile);
    const currFilePath: string = path.resolve(currDataRoot, schemaTable.jsonFile);

    let prevDataRaw = JSON.parse(fs.readFileSync(prevFilePath, {encoding: 'utf8'}));
    let currDataRaw = JSON.parse(fs.readFileSync(currFilePath, {encoding: 'utf8'}));
    const prevData: {[key: string]: any} = mapBy(prevDataRaw, primaryKey);
    const currData: {[key: string]: any} = mapBy(currDataRaw, primaryKey);

    console.log(`Computing changelog for SchemaTable: ${schemaTable.name} // pkey: ${primaryKey} // ` +
      'CurrKeyCount:', Object.keys(currData).length, 'PrevKeyCount:', Object.keys(prevData).length);

    const addedKeys: Set<string> = new Set(Object.keys(currData).filter(key => !prevData[key]));
    const removedKeys: Set<string> = new Set(Object.keys(prevData).filter(key => !currData[key]));

    const changedRecords: ChangeRecordMap = state.excelChangelog[schemaTable.name].changedRecords;

    for (let addedKey of addedKeys) {
      walkObject(currData[addedKey], field => isObfFieldName(field.basename) ? 'DELETE' : 'CONTINUE');
      changedRecords[addedKey].changeType = 'added';
      changedRecords[addedKey].addedRecord = currData[addedKey];
    }

    for (let removedKey of removedKeys) {
      walkObject(prevData[removedKey], field => isObfFieldName(field.basename) ? 'DELETE' : 'CONTINUE');
      changedRecords[removedKey].changeType = 'removed';
      changedRecords[removedKey].removedRecord = prevData[removedKey];
    }

    for (let key of Object.keys(currData)) {
      if (addedKeys.has(key) || removedKeys.has(key)) {
        continue;
      }
      const currRecord: any = currData[key];
      const prevRecord: any = prevData[key];

      const pathsInCurrRecord: Set<string> = new Set();
      let didFindChanges: boolean = false;

      // Walk through the current record.
      // This can only check for added and updated fields.
      // Added the path to 'pathsInCurrRecord' so we can check for removed fields later.
      walkObject(currRecord, field => {
        if (isObfFieldName(field.basename)) { // skip the gibberish/obfuscated fields
          return 'NO-DESCEND';
        }

        pathsInCurrRecord.add(field.path);
        const valueInCurr = field.value;
        const valueInPrev = resolveObjectPath(prevRecord, field.path);
        let ret = undefined;

        if (isUnset(valueInPrev)) {
          // Field was added:
          didFindChanges = true;
          changedRecords[key].updatedFields[field.path].newValue = valueInCurr;
          ret = 'NO-DESCEND';
        } else if (!isEquiv(valueInCurr, valueInPrev, field => isObfFieldName(field.basename))) {
          // Field was updated:
          didFindChanges = true;
          changedRecords[key].updatedFields[field.path].newValue = valueInCurr;
          changedRecords[key].updatedFields[field.path].oldValue = valueInPrev;
          ret = 'CONTINUE';
        }

        // Regardless of whether the field was added/updated, if it's a TextMapHash then we need to check it,
        // because it's possible for the content of the TextMapHash to have been updated, but not the TextMapHash number itself.
        if (field.basename.endsWith('MapHash') || field.basename.endsWith('MapHashList')) {
          let hashes: TextMapHash[] = Array.isArray(field.value) ? field.value : [field.value];
          for (let hash of hashes) {
            if (compositeTextMapHashUpdated.has(hash)) {
              didFindChanges = true;
              for (let textMapChanges of Object.values(state.textmapChangelog)) {
                if (textMapChanges.updated[hash]) {
                  changedRecords[key].updatedFields[field.path].textChanges.push({
                    langCode: textMapChanges.langCode,
                    oldValue: textMapChanges.updated[hash].oldValue,
                    newValue: textMapChanges.updated[hash].newValue,
                  });
                }
              }
            }
          }
          // Do not descend, fields ending in 'MapHash'/'MapHashList' should always be considered leaf fields.
          ret = 'NO-DESCEND';
        }

        return ret;
      });

      // Walk through the previous record.
      // If the path is not in 'pathsInCurrRecord' then that means the field was removed.
      walkObject(prevRecord, field => {
        // Skip the gibberish/obfuscated fields:
        if (isObfFieldName(field.basename)) {
          return 'NO-DESCEND';
        }

        // If the path is in the current record, then that means this path was not removed
        if (pathsInCurrRecord.has(field.path)) {
          if (field.basename.endsWith('MapHash') || field.basename.endsWith('MapHashList')) {
            // If the path ends with 'MapHash'/'MapHashList' then we should consider that a leaf field
            // and should not descend.
            return 'NO-DESCEND';
          } else {
            // Otherwise, continue. A path being in the current record does not necessarily mean all of its sub-paths
            // will also be in the current record, so we have to continue walking down this path.
            return 'CONTINUE';
          }
        }

        // If the path is not in the current record, then that means the field was removed:
        didFindChanges = true;
        changedRecords[key].updatedFields[field.path].oldValue = field.value;

        // If the path ends with 'MapHash'/'MapHashList' then we should consider that a leaf field:
        if (field.basename.endsWith('MapHash') || field.basename.endsWith('MapHashList')) {
          return 'NO-DESCEND';
        }
      });

      if (didFindChanges) {
        changedRecords[key].changeType = 'updated';
      }
    }
  }

  try {
    fs.writeFileSync(state.excelChangelogFileName, JSON.stringify(state.excelChangelog, null, 2), {
      encoding: 'utf-8'
    });
  } catch (e) {
    console.error('Error writing ' + state.excelChangelogFileName);
    throw e;
  }
  console.log('Finished computing Excel File changes.');
}

export async function createChangelog(versionLabel: string): Promise<void> {
  const state: CreateChangelogState = new CreateChangelogState(versionLabel);

  await computeTextMapChanges(state);
  await computeTextMapComposites(state);
  await computeExcelFileChanges(state);
}

/**
 * Checks if a name is an obfuscated/gibberish name like `GFLDJMJKIKE`.
 *
 * There shouldn't be any normal field names that are 11 characters (or more) long and in all caps.
 */
function isObfFieldName(name: string): boolean {
  return name.length >= 11 && name.toUpperCase() === name;
}
