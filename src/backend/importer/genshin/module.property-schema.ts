import { getGenshinDataFilePath } from '../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { createPropertySchema } from '../schema/translate_schema.ts';
import { normalizeRawJson } from '../import_db.ts';
import { genshinSchema } from './genshin.schema.ts';

export async function writeMappedExcels() {
  function getExcelFilePair(filePath: string) {
    return {
      schemaFilePath: path.resolve(process.env.GENSHIN_ARCHIVES, `./5.4/`, filePath.replaceAll('\\', '/')),
      obfFilePath: getGenshinDataFilePath(filePath),
    };
  }

  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');
  const mappedExcelDirPath = getGenshinDataFilePath('./ExcelBinOutputMapped');

  fs.mkdirSync(mappedExcelDirPath, { recursive: true });

  const copyOnlySchemas = [
    'MainQuestExcelConfigData',
    'QuestExcelConfigData',
    'TalkExcelConfigData',
    'DialogExcelConfigData',
    'DialogUnparentedExcelConfigData',
    'CodexQuestExcelConfigData',
  ];

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let _jsonFile of jsonsInDir) {
    const fileName = path.basename(_jsonFile);
    const schemaName = fileName.split('.')[0];

    const files = getExcelFilePair(`./ExcelBinOutput/${fileName}`);
    if (!fs.existsSync(files.schemaFilePath)) {
      console.log('NEW EXCEL: not in schema - ' + schemaName);
      continue;
    } else {
      console.log('Processing ' + schemaName);
    }


    const absJsonPath = getGenshinDataFilePath('./ExcelBinOutput/' + fileName);
    let json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));

    if (!copyOnlySchemas.includes(schemaName)) {
      const propertySchema = await createPropertySchema(
        files.schemaFilePath,
        files.obfFilePath
      );
      json = normalizeRawJson(json, genshinSchema[schemaName], propertySchema);
    }

    fs.writeFileSync(path.resolve(mappedExcelDirPath, './' + schemaName + '.json'), JSON.stringify(json, null, 2));
  }

  console.log('Done');
}

