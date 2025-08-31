import { getWuwaDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';

export async function wuwaNormalize() {
  const textMapDE = getWuwaDataFilePath('./TextMap/de/MultiText.json');
  const textMapEN = getWuwaDataFilePath('./TextMap/en/MultiText.json');
  const textMapES = getWuwaDataFilePath('./TextMap/es/MultiText.json');
  const textMapFR = getWuwaDataFilePath('./TextMap/fr/MultiText.json');
  const textMapID = getWuwaDataFilePath('./TextMap/id/MultiText.json');
  const textMapJA = getWuwaDataFilePath('./TextMap/ja/MultiText.json');
  const textMapKO = getWuwaDataFilePath('./TextMap/ko/MultiText.json');
  const textMapPT = getWuwaDataFilePath('./TextMap/pt/MultiText.json');
  const textMapRU = getWuwaDataFilePath('./TextMap/ru/MultiText.json');
  const textMapTH = getWuwaDataFilePath('./TextMap/th/MultiText.json');
  const textMapVI = getWuwaDataFilePath('./TextMap/vi/MultiText.json');
  const textMapCHS = getWuwaDataFilePath('./TextMap/zh-Hans/MultiText.json');
  const textMapCHT = getWuwaDataFilePath('./TextMap/zh-Hant/MultiText.json');

  fs.copyFileSync(textMapDE, getWuwaDataFilePath('./TextMap/TextMapDE.json'));
  fs.copyFileSync(textMapEN, getWuwaDataFilePath('./TextMap/TextMapEN.json'));
  fs.copyFileSync(textMapES, getWuwaDataFilePath('./TextMap/TextMapES.json'));
  fs.copyFileSync(textMapFR, getWuwaDataFilePath('./TextMap/TextMapFR.json'));
  fs.copyFileSync(textMapID, getWuwaDataFilePath('./TextMap/TextMapID.json'));
  fs.copyFileSync(textMapJA, getWuwaDataFilePath('./TextMap/TextMapJP.json'));

  fs.copyFileSync(textMapKO, getWuwaDataFilePath('./TextMap/TextMapKR.json'));
  fs.copyFileSync(textMapPT, getWuwaDataFilePath('./TextMap/TextMapPT.json'));
  fs.copyFileSync(textMapRU, getWuwaDataFilePath('./TextMap/TextMapRU.json'));
  fs.copyFileSync(textMapTH, getWuwaDataFilePath('./TextMap/TextMapTH.json'));
  fs.copyFileSync(textMapVI, getWuwaDataFilePath('./TextMap/TextMapVI.json'));
  fs.copyFileSync(textMapCHS, getWuwaDataFilePath('./TextMap/TextMapCHS.json'));
  fs.copyFileSync(textMapCHT, getWuwaDataFilePath('./TextMap/TextMapCHT.json'));

  await importNormalize(getWuwaDataFilePath('./ConfigDB'), ['GmOrderList.json'], 'wuwa');
}
