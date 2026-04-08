import { getGenshinDataFilePath } from '../../loadenv.ts';
import fs from 'fs';
import { importNormalize } from '../util/import_file_util.ts';
import { fsExists, fsReadJson } from '../../util/fsutil.ts';

async function tmJsons(path: string): Promise<any[]> {
  path = getGenshinDataFilePath(path);

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

export async function genshinNormalize() {
  const infos = [
    {addon: './TextMap/TextMap_MediumCHS.json',  mainfile: './TextMap/TextMapCHS.json'},
    {addon: './TextMap/TextMap_MediumCHT.json',  mainfile: './TextMap/TextMapCHT.json'},
    {addon: './TextMap/TextMap_MediumDE.json',   mainfile: './TextMap/TextMapDE.json'},
    {addon: './TextMap/TextMap_MediumEN.json',   mainfile: './TextMap/TextMapEN.json'},
    {addon: './TextMap/TextMap_MediumES.json',   mainfile: './TextMap/TextMapES.json'},
    {addon: './TextMap/TextMap_MediumFR.json',   mainfile: './TextMap/TextMapFR.json'},
    {addon: './TextMap/TextMap_MediumID.json',   mainfile: './TextMap/TextMapID.json'},
    {addon: './TextMap/TextMap_MediumIT.json',   mainfile: './TextMap/TextMapIT.json'},
    {addon: './TextMap/TextMap_MediumJP.json',   mainfile: './TextMap/TextMapJP.json'},
    {addon: './TextMap/TextMap_MediumKR.json',   mainfile: './TextMap/TextMapKR.json'},
    {addon: './TextMap/TextMap_MediumPT.json',   mainfile: './TextMap/TextMapPT.json'},
    {addon: './TextMap/TextMap_MediumRU.json',   mainfile: './TextMap/TextMapRU.json'},
    {addon: './TextMap/TextMap_MediumTH.json',   mainfile: './TextMap/TextMapTH.json'},
    {addon: './TextMap/TextMap_MediumTR.json',   mainfile: './TextMap/TextMapTR.json'},
    {addon: './TextMap/TextMap_MediumVI.json',   mainfile: './TextMap/TextMapVI.json'},
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

    fs.writeFileSync(getGenshinDataFilePath(info.mainfile), JSON.stringify(fullJson, null, 2), 'utf-8');
  }

  await delBadTalk();

  await importNormalize(getGenshinDataFilePath('./ExcelBinOutput'), ['ProudSkillExcelConfigData.json', 'DialogExcelConfigData.json'], 'genshin');
}

async function delBadTalk() {
  const t0 = getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData_0.json');
  const t1 = getGenshinDataFilePath('./ExcelBinOutput/TalkExcelConfigData_1.json');
  if (fs.existsSync(t0))
    fs.unlinkSync(t0);
  if (fs.existsSync(t1))
    fs.unlinkSync(t1);
}
