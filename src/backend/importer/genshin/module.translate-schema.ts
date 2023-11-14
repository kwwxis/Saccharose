import { getGenshinDataFilePath } from '../../loadenv';
import fs, { promises as fsp } from 'fs';
import path from 'path';
import { normalizeRawJson } from '../import_db';
import { genshinSchema } from './genshin.schema';
import { translateSchema } from '../util/translate_schema';
import chalk from 'chalk';

export async function importTranslateSchema() {
  function getExcelFilePair(filePath: string) {
    return {
      impExcelPath: path.resolve(process.env.GENSHIN_PREV_DATA_ROOT, filePath.replaceAll('\\', '/')),
      agdExcelPath: getGenshinDataFilePath(filePath),
    };
  }

  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  const schemaResult = {};

  for (let schemaTable of Object.values(genshinSchema)) {
    if (!schemaTable.jsonFile.includes('ExcelBinOutput')
      || schemaTable.jsonFile.includes('DialogExcel')
      || schemaTable.jsonFile.includes('DialogUnparented')
      || schemaTable.name.includes('MainQuestExcel')
      || schemaTable.name.includes('QuestExcel')
      || schemaTable.name.includes('TalkExcel')
      || schemaTable.name.includes('Relation_')) {
      continue;
    }
    console.log('Processing schema table: ' + schemaTable.name + '...');
    let files = getExcelFilePair(schemaTable.jsonFile);
    schemaResult[schemaTable.name] = await translateSchema(files.impExcelPath, files.agdExcelPath);
  }

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let jsonFile of jsonsInDir) {
    const schemaName = path.basename(jsonFile).split('.')[0];
    if (genshinSchema[schemaName]) {
      continue;
    }
    console.log('Processing excel json: ' + schemaName + '...');
    try {
      let files = getExcelFilePair('./ExcelBinOutput/' + schemaName + '.json');
      schemaResult[schemaName] = await translateSchema(files.impExcelPath, files.agdExcelPath);
    } catch (e) {
      console.log('Skipping ' + schemaName + ' - no file');
      continue;
    }
  }

  console.log('Writing output...');
  const outDir = process.env.GENSHIN_DATA_ROOT;
  fs.writeFileSync(outDir + '/SchemaTranslation.json', JSON.stringify(schemaResult, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/SchemaTranslation.json'));
}

export async function translateExcel(outputDirectory: string) {
  if (/^C:[^\\/]/g.test(outputDirectory)) {
    console.error('Invalid path: ' + outputDirectory);
    return;
  }
  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  fs.mkdirSync(outputDirectory, { recursive: true });

  const schemaTranslationFilePath = getGenshinDataFilePath('./SchemaTranslation.json');
  const schemaTranslation: { [tableName: string]: { [key: string]: string } } =
    fs.existsSync(schemaTranslationFilePath)
      ? JSON.parse(fs.readFileSync(schemaTranslationFilePath, { encoding: 'utf8' }))
      : {};

  const jsonsInDir = fs.readdirSync(excelDirPath).filter(file => path.extname(file) === '.json');
  for (let jsonFile of jsonsInDir) {
    const schemaName = path.basename(jsonFile).split('.')[0];
    console.log('Processing ' + schemaName + ' has translation? ' + (schemaTranslation[schemaName] ? 'yes' : 'no'));

    const absJsonPath = getGenshinDataFilePath('./ExcelBinOutput/' + jsonFile);
    const json = await fsp.readFile(absJsonPath, { encoding: 'utf8' }).then(data => JSON.parse(data));

    const normJson = normalizeRawJson(json, genshinSchema[schemaName], schemaTranslation[schemaName]);
    fs.writeFileSync(path.resolve(outputDirectory, './' + schemaName + '.json'), JSON.stringify(normJson, null, 2));
  }

  console.log('Done');
}