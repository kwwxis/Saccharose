import { getGenshinDataFilePath, getStarRailDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function genshinNormalize() {
  const thC_path = getGenshinDataFilePath('./TextMap/TextMapTH.json');
  const th0_path = getGenshinDataFilePath('./TextMap/TextMapTH_0.json');
  const th1_path = getGenshinDataFilePath('./TextMap/TextMapTH_1.json');

  const thC_json = {};

  if (fs.existsSync(thC_path)) {
    Object.assign(thC_json, JSON.parse(fs.readFileSync(thC_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(th0_path)) {
    Object.assign(thC_json, JSON.parse(fs.readFileSync(th0_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(th1_path)) {
    Object.assign(thC_json, JSON.parse(fs.readFileSync(th1_path, { encoding: 'utf8' })));
  }

  fs.writeFileSync(getGenshinDataFilePath('./TextMap/TextMapTH.json'),
    JSON.stringify(thC_json, null, 2), 'utf-8');

  const ja_path = getGenshinDataFilePath('./TextMap/TextMapJA.json');
  const ko_path = getGenshinDataFilePath('./TextMap/TextMapKO.json');

  if (fs.existsSync(ja_path)) {
    fs.renameSync(ja_path, getGenshinDataFilePath('./TextMap/TextMapJP.json'));
    console.log('Moved TextMapJA.json to TextMapJP.json');
  }

  if (fs.existsSync(ko_path)) {
    fs.renameSync(ko_path, getGenshinDataFilePath('./TextMap/TextMapKR.json'));
    console.log('Moved TextMapKO.json to TextMapKR.json');
  }

  await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json'], 'genshin');
}
