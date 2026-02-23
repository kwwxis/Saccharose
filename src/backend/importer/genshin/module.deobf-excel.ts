import { getGenshinDataFilePath } from '../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import {
  createPropertySchema,
  createPropertySchemaPostProcess_imprintEmptyArrays,
  PropertySchemaResult,
} from '../schema/translate_schema.ts';
import { normalizeRawJson } from '../import_db.ts';
import { genshinSchema } from './genshin.schema.ts';

export async function writeDeobfExcels() {
  function getSchemaFilePath(filePath: string): string {
    return path.resolve(ENV.GENSHIN_ARCHIVES, `./5.4/ExcelBinOutput/`, filePath);
  }

  const rawExcelDirPath = getGenshinDataFilePath('./ExcelBinOutput.Raw');
  const mappedExcelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  fs.mkdirSync(mappedExcelDirPath, { recursive: true });

  const schemaNamesForCopyOnly = [
    'MainQuestExcelConfigData',
    'QuestExcelConfigData',
    'TalkExcelConfigData',
    'DialogExcelConfigData',
    'DialogUnparentedExcelConfigData',
    'CodexQuestExcelConfigData',
  ];

  const schemaNamesVisitMaxPairs: Record<string, number> = { };
  const schemaNamesMaxRecordSlice: Record<string, number> = {
    'MaterialSourceDataExcelConfigData': 1000
  };

  let startAt: string = null; // inclusive
  let endAt: string = null; // inclusive
  let didStart: boolean = (s => !s)(startAt);

  // noinspection JSMismatchedCollectionQueryUpdate (empty array: whitelist not enabled)
  const whitelist: string[] = [];

  // GadgetExcelConfigData
  // ManualTextMapConfigData
  // NpcExcelConfigData
  // RewardExcelConfigData

  const jsonsInDir = fs.readdirSync(rawExcelDirPath).filter(file => path.extname(file) === '.json');
  for (let _jsonFile of jsonsInDir) {
    const fileName = path.basename(_jsonFile);
    const schemaName = fileName.split('.')[0];

    if (whitelist && whitelist.length && !whitelist.includes(schemaName)) {
      continue;
    }

    if (schemaName === startAt) {
      didStart = true;
    }

    if (!didStart) {
      continue;
    }

    const schemaFilePath = getSchemaFilePath(fileName);
    if (!fs.existsSync(schemaFilePath)) {
      console.log('NEW EXCEL: not in schema - ' + schemaName);

      const absJsonPath = path.resolve(rawExcelDirPath, fileName);
      let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));
      json = normalizeRawJson(json);
      fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'), JSON.stringify(json, null, 2));
    } else {
      console.log('Processing ' + schemaName);

      const absJsonPath = path.resolve(rawExcelDirPath, fileName);
      let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));

      if (!schemaNamesForCopyOnly.includes(schemaName)) {
        const propertySchema: PropertySchemaResult = await createPropertySchema(
          genshinSchema,
          schemaName,
          schemaFilePath,
          absJsonPath,
          schemaNamesVisitMaxPairs[schemaName],
          schemaNamesMaxRecordSlice[schemaName]
        );
        json = normalizeRawJson(json, genshinSchema[schemaName], propertySchema.map);
        createPropertySchemaPostProcess_imprintEmptyArrays(json, propertySchema.arrayPaths);
      }

      fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'), JSON.stringify(json, null, 2));
    }

    if (schemaName === endAt) {
      break;
    }
  }

  console.log('Done');
}

