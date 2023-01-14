import '../../loadenv';
import { Control, getControl } from '../script_util';
import { loadEnglishTextMap } from '../textmap';
import { isEmpty } from '../../../shared/util/genericUtil';
import { resolveObjectPath } from '../../../shared/util/arrayUtil';
import { closeKnex } from '../../util/db';
import { pathToFileURL } from 'url';

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
    let isOptionalField = values.some(v => typeof v === 'undefined' || v === null);
    values = values.filter(v => typeof v !== 'undefined' && v !== null)

    values = values.map(x => String(JSON.stringify(x)).replace(/"/g, "'"));

    let singleLineThreshold: boolean = values.join(' | ').length < 110;
    if (!singleLineThreshold) {
      let padEndNum = Math.max(... values.map(v => v.length));
      if (padEndNum % 4 !== 0) {
        padEndNum += 4 - (padEndNum % 4);
      }
      values = values.map(v => v.padEnd(padEndNum));
    }

    let valueStr = values.join(singleLineThreshold ? ' | ' : '|\n  ') + ';';
    console.log(`${file} - Unique values for field "${field}":${isOptionalField ? ' (optional)' : ''}\n` + valueStr);
  }
  console.log('Unique fields:\n{');
  for (let field of Object.keys(uniqueFields)) {
    console.log(`  ${field}: ${uniqueFields[field]},`);
  }
  console.log('}')
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
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

    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/LocalizationExcelConfigData.json', ['AssetType']);
    //await inspectGenshinDataFile(ctrl, './ExcelBinOutput/TalkExcelConfigData.json', ['BeginCond[#ALL].Type', 'FinishExec[#ALL].Type', 'HeroTalk']);
    // await inspectGenshinDataFile(ctrl, './ExcelBinOutput/QuestExcelConfigData.json', [
    //   'AcceptCond[#ALL].Type', 'BeginExec[#ALL].Type',
    //   'FailCond[#ALL].Type', 'FailExec[#ALL].Type',
    //   'FinishCond[#ALL].Type', 'FinishExec[#ALL].Type',
    // ]);
    // await inspectGenshinDataFile(ctrl, './ExcelBinOutput/ReliquaryExcelConfigData.json', ['EquipType', 'ItemType', 'DestroyRule']);
    await inspectGenshinDataFile(ctrl, './ExcelBinOutput/WeaponExcelConfigData.json', ['WeaponType', 'DestroyRule', 'ItemType']);

    await closeKnex();
  })();
}