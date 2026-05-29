import { ExcelChangeRecord } from '../../../../shared/types/changelog-types.ts';
import { schemaPrimaryKey } from '../../import_db.ts';
import path from 'path';
import { fsExists } from '../../../util/fsutil.ts';
import fs from 'fs';
import { isEquiv, mapBy, resolveObjectPath, walkObject } from '../../../../shared/util/arrayUtil.ts';
import { defaultMap, isUnset } from '../../../../shared/util/genericUtil.ts';
import { toString } from '../../../../shared/util/stringUtil.ts';
import { TextMapHash } from '../../../../shared/types/lang-types.ts';
import { importExcelChanges } from '../../../domain/abstract/excelchanges.ts';
import { CreateChangelogOpts } from './createChangelogUtil.ts';

export async function computeExcelFileChanges(opts: CreateChangelogOpts) {
  const changeRecords: ExcelChangeRecord[] = [];

  const updatedTextMapHashes = await opts.ctrl.textMapChangelog.selectUpdatedTextMapHashes(opts.version.number);
  console.log(`Loaded ${Object.keys(updatedTextMapHashes).length} updated textmap hashes for ${opts.version.number}`);
  const { prevDataRoot, currDataRoot, noPriorChangelog } = opts;

  for (let schemaTable of Object.values(opts.gameSchema)) {
    if (schemaTable.name.startsWith('Relation_') || schemaTable.name.startsWith('PlainLineMap') || schemaTable.name.startsWith('TextMap')) {
      continue;
    }
    if (schemaTable.changelog?.excluded) {
      continue;
    }

    // Get the primary key of the table:
    const primaryKey: string = schemaPrimaryKey(schemaTable);

    // If the table doesn't have a primary key, then we are unable to compute its diff. So it has to be skipped:
    if (!primaryKey) {
      continue;
    }

    const metadataOnly: boolean = schemaTable.changelog?.metadataOnly || false;
    const prevFilePath: string = path.resolve(prevDataRoot, schemaTable.jsonFile);
    const currFilePath: string = path.resolve(currDataRoot, schemaTable.jsonFile);

    const prevFileExists: boolean = (await fsExists(prevFilePath)) && !noPriorChangelog;
    const currFileExists: boolean = await fsExists(currFilePath);

    if (!prevFileExists && !currFileExists) {
      continue;
    }

    const prevDataRaw: any[] = prevFileExists ? JSON.parse(fs.readFileSync(prevFilePath, { encoding: 'utf8' })) : [];
    const currDataRaw: any[] = currFileExists ? JSON.parse(fs.readFileSync(currFilePath, { encoding: 'utf8' })) : [];
    const prevData: { [key: string]: any } = mapBy(prevDataRaw, primaryKey);
    const currData: { [key: string]: any } = mapBy(currDataRaw, primaryKey);

    console.log(`Computing changelog for SchemaTable: ${schemaTable.name} // pkey: ${primaryKey} // ` +
      'CurrKeyCount:', Object.keys(currData).length, 'PrevKeyCount:', Object.keys(prevData).length);

    const addedKeys: Set<string> = new Set(Object.keys(currData).filter(key => !prevData[key]));
    const removedKeys: Set<string> = new Set(Object.keys(prevData).filter(key => !currData[key]));

    if (!schemaTable.changelog?.excludeAdded) {
      for (let addedKey of addedKeys) {
        walkObject(currData[addedKey], field => isObfFieldName(field.basename) ? 'DELETE' : 'CONTINUE');

        const changeRecord: ExcelChangeRecord = {
          versionNumber: opts.version.number,
          excelFile: schemaTable.name,
          key: addedKey,
          changeType: 'added',
          addedRecord: currData[addedKey],
        };

        if (metadataOnly) {
          delete changeRecord.addedRecord;
          changeRecord._metadataOnly = true;
        }

        changeRecords.push(changeRecord);
      }
    }

    if (!schemaTable.changelog?.excludeRemoved) {
      for (let removedKey of removedKeys) {
        walkObject(prevData[removedKey], field => isObfFieldName(field.basename) ? 'DELETE' : 'CONTINUE');

        const changeRecord: ExcelChangeRecord = {
          versionNumber: opts.version.number,
          excelFile: schemaTable.name,
          key: removedKey,
          changeType: 'removed',
          removedRecord: prevData[removedKey],
        };

        if (metadataOnly) {
          delete changeRecord.removedRecord;
          changeRecord._metadataOnly = true;
        }

        changeRecords.push(changeRecord);
      }
    }

    if (!schemaTable.changelog?.excludeUpdated) {
      for (let key of Object.keys(currData)) {
        if (addedKeys.has(key) || removedKeys.has(key)) {
          continue;
        }
        const currRecord: any = currData[key];
        const prevRecord: any = prevData[key];

        const changeRecord: ExcelChangeRecord = {
          versionNumber: opts.version.number,
          excelFile: schemaTable.name,
          key: key,
          changeType: 'updated',
          updatedFields: defaultMap(field => ({
            field: toString(field),
          })),
        };
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
            changeRecord.updatedFields[field.path].newValue = valueInCurr;
            ret = 'NO-DESCEND';
          } else if (!isEquiv(valueInCurr, valueInPrev, field => isObfFieldName(field.basename))) {
            // Field was updated:
            didFindChanges = true;
            changeRecord.updatedFields[field.path].newValue = valueInCurr;
            changeRecord.updatedFields[field.path].oldValue = valueInPrev;
            ret = 'CONTINUE';
          }

          // Regardless of whether the field was added/updated, if it's a TextMapHash then we need to check it,
          // because it's possible for the content of the TextMapHash to have been updated, but not the TextMapHash number itself.
          if (field.basename.endsWith('MapHash') || field.basename.endsWith('MapHashList')) {
            let hashes: TextMapHash[] = Array.isArray(field.value) ? field.value : [field.value];
            for (let hash of hashes) {
              if (updatedTextMapHashes[hash]) {
                didFindChanges = true;
                changeRecord.updatedFields[field.path].textChanges = [];
                for (let tmChangeEntity of updatedTextMapHashes[hash]) {
                  changeRecord.updatedFields[field.path].textChanges.push({
                    langCode: tmChangeEntity.lang_code,
                    oldValue: tmChangeEntity.prev_content,
                    newValue: tmChangeEntity.content,
                  });
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
          changeRecord.updatedFields[field.path].oldValue = field.value;

          // If the path ends with 'MapHash'/'MapHashList' then we should consider that a leaf field:
          if (field.basename.endsWith('MapHash') || field.basename.endsWith('MapHashList')) {
            return 'NO-DESCEND';
          }
        });

        if (didFindChanges) {
          if (metadataOnly) {
            delete changeRecord.updatedFields;
            changeRecord._metadataOnly = true;
          }
          changeRecords.push(changeRecord);
        }
      }
    }
  }

  console.log('Beginning importing Excel change entities');
  await importExcelChanges(opts.ctrl.knex, changeRecords, opts.version);
  console.log('Finished importing Excel change entities');
}

/**
 * Checks if a name is an obfuscated/gibberish name like `GFLDJMJKIKE`.
 *
 * There shouldn't be any normal field names that are 11 characters (or more) long and in all caps.
 */
function isObfFieldName(name: string): boolean {
  return name.length >= 11 && name.toUpperCase() === name;
}
