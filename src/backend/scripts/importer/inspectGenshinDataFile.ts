import '../../loadenv';
import { Control, getControl } from '../script_util';
import { loadEnglishTextMap } from '../textmap';
import { isEmpty } from '../../../shared/util/genericUtil';
import { resolveObjectPath } from '../../../shared/util/arrayUtil';
import { closeKnex } from '../../util/db';
import { isInt } from '../../../shared/util/numberUtil';

async function inspectGenshinDataFile(ctrl: Control, file: string, inspectFieldValues: string[] = [], printRecordsWithAnyValueForTheseFields: string[] = []): Promise<any[]> {
  if (!inspectFieldValues)
    inspectFieldValues = [];
  if (!printRecordsWithAnyValueForTheseFields)
    printRecordsWithAnyValueForTheseFields = [];

  const result: any[] = await ctrl.readGenshinDataFile(file);

  let inspectFieldsResult: {[fieldName: string]: Set<any>} = {};
  let uniqueFields: {[name: string]: string} = {};

  for (let record of result) {
    for (let fieldName of inspectFieldValues) {
      if (!inspectFieldsResult[fieldName]) {
        inspectFieldsResult[fieldName] = new Set<any>();
      }
      let resolved = resolveObjectPath(record, fieldName);
      if (Array.isArray(resolved)) {
        resolved.forEach(x => inspectFieldsResult[fieldName].add(x));
      } else {
        inspectFieldsResult[fieldName].add(resolved);
      }
    }
    for (let fieldName of printRecordsWithAnyValueForTheseFields) {
      if (!!record[fieldName]) {
        console.log(fieldName, record);
      }
    }
    Object.keys(record).forEach(key => {
      if (isEmpty(record[key])) {
        return;
      }
      if (Array.isArray(record[key])) {
        let val = record[key].find(x => !isEmpty(x));
        if (isEmpty(val)) {
          return;
        }
        uniqueFields[key] = (typeof val) + '[]';
      } else {
        uniqueFields[key] = typeof record[key];
      }
    });
  }

  console.log('-'.repeat(100))
  for (let field of inspectFieldValues) {
    let values = Array.from(inspectFieldsResult[field]).sort();
    console.log(`${file} - Unique values for field "${field}":\n  ` + values.map(x => (''+JSON.stringify(x))
      .replace(/"/g, "'")).join(values.length < 4 || values.every(x => isInt(x)) ? ' | ' : ' |\n  '));
  }
  console.log('Unique fields:\n{');
  for (let field of Object.keys(uniqueFields)) {
    console.log(`  ${field}: ${uniqueFields[field]},`);
  }
  console.log('}')
  return result;
}

if (require.main === module) {
  (async () => {
    const ctrl = getControl();
    await loadEnglishTextMap();

    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/DialogExcelConfigData.json', ['TalkRole.Type']);
    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/MaterialExcelConfigData.json', ['MaterialType', 'ItemType', 'UseTarget', 'ItemUse[#ALL].UseOp']);
    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/DungeonExcelConfigData.json', ['Type']);
    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/FettersExcelConfigData.json', ['OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType', 'Type']);
    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/FetterStoryExcelConfigData.json', ['OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType']);

    // let res = await inspectGenshinDataFile(ctrl, './ExcelBinOutput/FetterInfoExcelConfigData.json', ['AvatarAssocType', 'OpenConds[#ALL].CondType', 'FinishConds[#ALL].CondType']);
    // resolveObjectPath(res, '[#EVERY].Avatar', true);
    // console.log(res.slice(0, 5));

    await inspectGenshinDataFile(ctrl, './ExcelBinOutput/LocalizationExcelConfigData.json', ['AssetType']);

    await closeKnex();
  })();
}