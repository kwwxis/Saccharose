import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import path from 'path';
import { genshinSchema } from './genshin.schema.ts';
import { translateSchema } from '../util/translate_schema.ts';
import chalk from 'chalk';
import { CurrentGenshinVersion } from '../../../shared/types/game-versions.ts';

export async function createPropertySchema() {
  function getExcelFilePair(filePath: string) {
    return {
      impExcelPath: path.resolve(process.env.GENSHIN_ARCHIVES,
        `./${CurrentGenshinVersion.previous}/`, filePath.replaceAll('\\', '/')),
      agdExcelPath: getGenshinDataFilePath(filePath),
    };
  }

  const excelDirPath = getGenshinDataFilePath('./ExcelBinOutput');

  const schemaResult = {};

  for (let schemaTable of Object.values(genshinSchema)) {
    if (!schemaTable.jsonFile.includes('ExcelBinOutput')
      || schemaTable.jsonFile.includes('DialogExcel')
      || schemaTable.jsonFile.includes('DialogUnparented')
      || schemaTable.name.includes('CodexQuestExcel')
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
  fs.writeFileSync(outDir + '/PropertySchema.json', JSON.stringify(schemaResult, null, 2));
  console.log(chalk.blue('Done. Output written to: ' + outDir + '/PropertySchema.json'));
}

