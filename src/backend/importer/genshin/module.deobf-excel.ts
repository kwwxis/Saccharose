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
    return path.resolve(process.env.GENSHIN_ARCHIVES, `./5.4/ExcelBinOutput/`, filePath);
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

  const jsonsInDir = fs.readdirSync(rawExcelDirPath).filter(file => path.extname(file) === '.json');
  for (let _jsonFile of jsonsInDir) {
    const fileName = path.basename(_jsonFile);
    const schemaName = fileName.split('.')[0];

    const schemaFilePath = getSchemaFilePath(fileName);
    if (!fs.existsSync(schemaFilePath)) {
      console.log('NEW EXCEL: not in schema - ' + schemaName);
      continue;
    } else {
      console.log('Processing ' + schemaName);
    }

    const absJsonPath = path.resolve(rawExcelDirPath, fileName);
    let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));

    if (!schemaNamesForCopyOnly.includes(schemaName)) {
      const propertySchema: PropertySchemaResult = await createPropertySchema(
        genshinSchema,
        schemaName,
        schemaFilePath,
        absJsonPath
      );
      json = normalizeRawJson(json, genshinSchema[schemaName], propertySchema.map);
      createPropertySchemaPostProcess_imprintEmptyArrays(json, propertySchema.arrayPaths);
    }

    fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'), JSON.stringify(json, null, 2));
  }

  console.log('Done');
}

