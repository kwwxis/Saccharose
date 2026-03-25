import { getStarRailDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function starRailNormalize() {
  await fixThai();
  await fixRussian();
  await fixKorean();
  await importNormalize(getStarRailDataFilePath('./ExcelOutput'), [], 'hsr');
}

async function fixThai() {
  const thC_path = getStarRailDataFilePath('./TextMap/TextMapTH.json');
  const th0_path = getStarRailDataFilePath('./TextMap/TextMapTH_0.json');
  const th1_path = getStarRailDataFilePath('./TextMap/TextMapTH_1.json');

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

  fs.writeFileSync(getStarRailDataFilePath('./TextMap/TextMapTH.json'),
    JSON.stringify(thC_json, null, 2), 'utf-8');
}


async function fixRussian() {
  const ruC_path = getStarRailDataFilePath('./TextMap/TextMapRU.json');
  const ru0_path = getStarRailDataFilePath('./TextMap/TextMapRU_0.json');
  const ru1_path = getStarRailDataFilePath('./TextMap/TextMapRU_1.json');

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

  fs.writeFileSync(getStarRailDataFilePath('./TextMap/TextMapRU.json'),
    JSON.stringify(ruC_json, null, 2), 'utf-8');
}


async function fixKorean() {
  const krC_path = getStarRailDataFilePath('./TextMap/TextMapKR.json');
  const kr0_path = getStarRailDataFilePath('./TextMap/TextMapKR_0.json');
  const kr1_path = getStarRailDataFilePath('./TextMap/TextMapKR_1.json');

  const krC_json = {};

  if (fs.existsSync(krC_path)) {
    Object.assign(krC_json, JSON.parse(fs.readFileSync(krC_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(kr0_path)) {
    Object.assign(krC_json, JSON.parse(fs.readFileSync(kr0_path, {encoding: 'utf8'})));
  }
  if (fs.existsSync(kr1_path)) {
    Object.assign(krC_json, JSON.parse(fs.readFileSync(kr1_path, { encoding: 'utf8' })));
  }

  fs.writeFileSync(getStarRailDataFilePath('./TextMap/TextMapKR.json'),
    JSON.stringify(krC_json, null, 2), 'utf-8');
}
