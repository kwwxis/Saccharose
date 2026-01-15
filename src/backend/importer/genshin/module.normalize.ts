import { getGenshinDataFilePath, getStarRailDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function genshinNormalize() {
  await fixThai();
  await fixKorean();
  await fixRussian();
  await fixJapanese();
  await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json', 'DialogExcelConfigData.json'], 'genshin');
}

async function fixThai() {
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
}

async function delBadTalk() {
  const t0 = getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData_0.json');
  const t1 = getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData_1.json');
  fs.unlinkSync(t0);
  fs.unlinkSync(t1);
}

async function fixRussian() {
  const ruC_path = getGenshinDataFilePath('./TextMap/TextMapRU.json');
  const ru0_path = getGenshinDataFilePath('./TextMap/TextMapRU_0.json');
  const ru1_path = getGenshinDataFilePath('./TextMap/TextMapRU_1.json');

  const ruC_json = {};

  if (fs.existsSync(ruC_path)) {
    Object.assign(ruC_json, JSON.parse(fs.readFileSync(ruC_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(ru0_path)) {
    Object.assign(ruC_json, JSON.parse(fs.readFileSync(ru0_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(ru1_path)) {
    Object.assign(ruC_json, JSON.parse(fs.readFileSync(ru1_path, { encoding: 'utf8' })));
  }

  fs.writeFileSync(getGenshinDataFilePath('./TextMap/TextMapRU.json'),
    JSON.stringify(ruC_json, null, 2), 'utf-8');
}

async function fixKorean() {
  const ko_path = getGenshinDataFilePath('./TextMap/TextMapKO.json');
  if (fs.existsSync(ko_path)) {
    fs.renameSync(ko_path, getGenshinDataFilePath('./TextMap/TextMapKR.json'));
    console.log('Moved TextMapKO.json to TextMapKR.json');
  }
}

async function fixJapanese() {
  const ja_path = getGenshinDataFilePath('./TextMap/TextMapJA.json');
  if (fs.existsSync(ja_path)) {
    fs.renameSync(ja_path, getGenshinDataFilePath('./TextMap/TextMapJP.json'));
    console.log('Moved TextMapJA.json to TextMapJP.json');
  }
}
