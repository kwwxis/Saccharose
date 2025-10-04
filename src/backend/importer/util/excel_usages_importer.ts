import { AbstractControl } from '../../domain/abstract/abstractControl.ts';
import { fsReadJson, fsWalkSync } from '../../util/fsutil.ts';
import { pathToFileURL } from 'url';
import { getGenshinControl } from '../../domain/genshin/genshinControl.ts';
import path from 'node:path';
import { walkObject } from '../../../shared/util/arrayUtil.ts';
import { ExcelScalarEntity } from '../../../shared/types/common-types.ts';

function isScalar(v: any) {
  if (typeof v === 'string' && v.length > 128) {
    return false;
  }
  return (typeof v === 'number' || typeof v === 'string' || typeof v === 'bigint' || typeof v === 'symbol')
    && v !== '' && v !== 0 && v !== '0';
}

/** Utility function: split an array into chunks of given size */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export async function doImportExcelScalars(ctrl: AbstractControl) {
  const entitiesList: ExcelScalarEntity[] = [];
  const entitiesByValue: {[scalarValue: string]: ExcelScalarEntity} = {};

  for (let filePath of fsWalkSync(ctrl.getDataFilePath(ctrl.getExcelPath()))) {
    if (!filePath.endsWith('.json')) {
      continue;
    }

    const fname: string = path.basename(filePath).slice(0, -5);
    const json: any[] = await fsReadJson(filePath);

    if (!Array.isArray(json)) {
      console.log('Non-Iterable Excel: ' + filePath);
      continue;
    }

    let rowIndex = 0;
    for (let obj of json) {
      const seenScalarsInObj: Set<string> = new Set<string>();
      walkObject(obj, (curr) => {
        if (curr.isLeaf && isScalar(curr.value)) {
          const scalarValue: string = String(curr.value);
          if (seenScalarsInObj.has(scalarValue)) {
            return;
          } else {
            seenScalarsInObj.add(scalarValue);
          }
          let entity: ExcelScalarEntity;

          if (entitiesByValue[scalarValue]) {
            entity = entitiesByValue[scalarValue];
          } else {
            entity = {scalar_value: scalarValue, file_usages: {}};
            entitiesByValue[scalarValue] = entity;
            entitiesList.push(entity);
          }

          if (!entity.file_usages[fname]) {
            entity.file_usages[fname] = [];
          }

          entity.file_usages[fname].push(rowIndex);
        }
      });
      rowIndex++;
    }
  }

  console.log('Amount to insert: ' + entitiesList.length);
  const batchSize = 5000;

  await ctrl.knex('excel_scalars').truncate();

  await ctrl.knex.transaction(async (trx) => {
    const batches = chunk(entitiesList, batchSize);

    let batchNum = 0;
    for (const batch of batches) {
      batchNum++;
      await trx('excel_scalars').insert(batch)
        .onConflict(['scalar_value'])
        .merge();
      console.log(`Batch ${batchNum}/${batches.length}`);
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await doImportExcelScalars(getGenshinControl());
}
