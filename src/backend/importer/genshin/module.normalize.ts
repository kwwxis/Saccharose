import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function genshinNormalize() {
  const th0 = getGenshinDataFilePath('./TextMap/TextMapTH_0.json');
  const th1 = getGenshinDataFilePath('./TextMap/TextMapTH_1.json');

  const thC_json = {};
  const th0_json = JSON.parse(fs.readFileSync(th0, {encoding: 'utf8'}));
  const th1_json = JSON.parse(fs.readFileSync(th1, {encoding: 'utf8'}));
  Object.assign(thC_json, th0_json, th1_json);
  fs.writeFileSync(getGenshinDataFilePath('./TextMap/TextMapTH.json'), JSON.stringify(thC_json, null, 2), 'utf-8');

  await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json'], 'genshin');
}
