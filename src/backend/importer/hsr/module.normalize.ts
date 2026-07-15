import { getStarRailDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';
import { fsExists, fsReadJson } from '../../util/fsutil.ts';

async function tmJsons(path: string): Promise<any[]> {
  path = getStarRailDataFilePath(path);

  let jsons: any[] = [];
  if (await fsExists(path)) {
    console.log('  Found ' + path);
    jsons.push(await fsReadJson(path));
  }

  for (let i = 0; i <= 2; i++) {
    let splitPath = path.replace('.json', `_${i}.json`);
    if (await fsExists(splitPath)) {
      console.log('  Found ' + splitPath);
      jsons.push(await fsReadJson(splitPath));
    }
  }

  return jsons;
}

export async function starRailNormalize() {
  const infos = [
    {addon: './TextMap/TextMapMainCHS.json',  mainfile: './TextMap/TextMapCHS.json'},
    {addon: './TextMap/TextMapMainCHT.json',  mainfile: './TextMap/TextMapCHT.json'},
    {addon: './TextMap/TextMapMainDE.json',   mainfile: './TextMap/TextMapDE.json'},
    {addon: './TextMap/TextMapMainEN.json',   mainfile: './TextMap/TextMapEN.json'},
    {addon: './TextMap/TextMapMainES.json',   mainfile: './TextMap/TextMapES.json'},
    {addon: './TextMap/TextMapMainFR.json',   mainfile: './TextMap/TextMapFR.json'},
    {addon: './TextMap/TextMapMainID.json',   mainfile: './TextMap/TextMapID.json'},
    {addon: './TextMap/TextMapMainIT.json',   mainfile: './TextMap/TextMapIT.json'},
    {addon: './TextMap/TextMapMainJP.json',   mainfile: './TextMap/TextMapJP.json'},
    {addon: './TextMap/TextMapMainKR.json',   mainfile: './TextMap/TextMapKR.json'},
    {addon: './TextMap/TextMapMainPT.json',   mainfile: './TextMap/TextMapPT.json'},
    {addon: './TextMap/TextMapMainRU.json',   mainfile: './TextMap/TextMapRU.json'},
    {addon: './TextMap/TextMapMainTH.json',   mainfile: './TextMap/TextMapTH.json'},
    {addon: './TextMap/TextMapMainTR.json',   mainfile: './TextMap/TextMapTR.json'},
    {addon: './TextMap/TextMapMainVI.json',   mainfile: './TextMap/TextMapVI.json'},
  ];
  for (let info of infos) {
    console.log('Processing ' + info.mainfile);
    let fullJson = {};

    for (let json of await tmJsons(info.mainfile)) {
      Object.assign(fullJson, json);
    }

    for (let json of await tmJsons(info.addon)) {
      Object.assign(fullJson, json);
    }

    fs.writeFileSync(getStarRailDataFilePath(info.mainfile), JSON.stringify(fullJson, null, 2), 'utf-8');
  }
  await importNormalize(getStarRailDataFilePath('./ExcelOutput'), [], 'hsr');
}
