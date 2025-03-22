import { getGenshinDataFilePath } from '../../loadenv.ts';
import path from 'path';
import fs, { promises as fsp } from 'fs';
import { normalizeRawJson } from '../import_db.ts';
import { genshinSchema } from './genshin.schema.ts';

export async function exportExcel(outputDirectory: string) {
  if (/^C:[^\\/]/g.test(outputDirectory)) {
    console.error('Invalid path: ' + outputDirectory);
    return;
  }
  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  if (!outputDirectory.endsWith('ExcelBinOutput')) {
    outputDirectory = path.resolve(outputDirectory, './ExcelBinOutput');
  }

  fs.mkdirSync(outputDirectory, { recursive: true });

  const propertySchemaPath = getGenshinDataFilePath('./PropertySchema.json');
  const propertySchema: { [tableName: string]: { [key: string]: string } } =
    fs.existsSync(propertySchemaPath)
      ? JSON.parse(fs.readFileSync(propertySchemaPath, { encoding: 'utf8' }))
      : {};

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let jsonFile of jsonsInDir) {
    const schemaName = path.basename(jsonFile).split('.')[0];
    console.log('Processing ' + schemaName + ' has property schema? ' + (propertySchema[schemaName] ? 'yes' : 'no'));

    const absJsonPath = getGenshinDataFilePath('./ExcelBinOutput/' + jsonFile);
    const json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));

    const normJson = normalizeRawJson(json, genshinSchema[schemaName], propertySchema[schemaName]);
    fs.writeFileSync(path.resolve(outputDirectory, './' + schemaName + '.json'), JSON.stringify(normJson, null, 2));
  }

  console.log('Done');
}
