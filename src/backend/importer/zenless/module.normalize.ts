import fs from 'fs';
import { getZenlessDataFilePath } from '../../loadenv.ts';
import { importNormalize } from '../util/import_file_util.ts';

export async function zenlessNormalize() {
  const infos = [
    {base: './TextMap/TextMapTemplateTb.json',      overwrite: './TextMap/TextMapOverwriteTemplateTb.json',      outfile: './TextMap/TextMapCHS.json'},
    {base: './TextMap/TextMap_CHTTemplateTb.json',  overwrite: './TextMap/TextMap_CHTOverwriteTemplateTb.json',  outfile: './TextMap/TextMapCHT.json'},
    {base: './TextMap/TextMap_DETemplateTb.json',   overwrite: './TextMap/TextMap_DEOverwriteTemplateTb.json',   outfile: './TextMap/TextMapDE.json'},
    {base: './TextMap/TextMap_ENTemplateTb.json',   overwrite: './TextMap/TextMap_ENOverwriteTemplateTb.json',   outfile: './TextMap/TextMapEN.json'},
    {base: './TextMap/TextMap_ESTemplateTb.json',   overwrite: './TextMap/TextMap_ESOverwriteTemplateTb.json',   outfile: './TextMap/TextMapES.json'},
    {base: './TextMap/TextMap_FRTemplateTb.json',   overwrite: './TextMap/TextMap_FROverwriteTemplateTb.json',   outfile: './TextMap/TextMapFR.json'},
    {base: './TextMap/TextMap_IDTemplateTb.json',   overwrite: './TextMap/TextMap_IDOverwriteTemplateTb.json',   outfile: './TextMap/TextMapID.json'},
    {base: './TextMap/TextMap_JATemplateTb.json',   overwrite: './TextMap/TextMap_JAOverwriteTemplateTb.json',   outfile: './TextMap/TextMapJP.json'},
    {base: './TextMap/TextMap_KOTemplateTb.json',   overwrite: './TextMap/TextMap_KOOverwriteTemplateTb.json',   outfile: './TextMap/TextMapKR.json'},
    {base: './TextMap/TextMap_PTTemplateTb.json',   overwrite: './TextMap/TextMap_PTOverwriteTemplateTb.json',   outfile: './TextMap/TextMapPT.json'},
    {base: './TextMap/TextMap_RUTemplateTb.json',   overwrite: './TextMap/TextMap_RUOverwriteTemplateTb.json',   outfile: './TextMap/TextMapRU.json'},
    {base: './TextMap/TextMap_THTemplateTb.json',   overwrite: './TextMap/TextMap_THOverwriteTemplateTb.json',   outfile: './TextMap/TextMapTH.json'},
    {base: './TextMap/TextMap_VITemplateTb.json',   overwrite: './TextMap/TextMap_VIOverwriteTemplateTb.json',   outfile: './TextMap/TextMapVI.json'},
  ];
  for (let info of infos) {
    const baseJson = JSON.parse(fs.readFileSync(getZenlessDataFilePath(info.base), {encoding: 'utf8'}));
    let overwriteJson = {};

    if (fs.existsSync(getZenlessDataFilePath(info.overwrite))) {
      overwriteJson = JSON.parse(fs.readFileSync(getZenlessDataFilePath(info.overwrite), {encoding: 'utf8'}));
    }

    const finalJson = Object.assign({}, baseJson, overwriteJson);

    fs.writeFileSync(getZenlessDataFilePath(info.outfile), JSON.stringify(finalJson, null, 2), 'utf-8');
  }

  await importNormalize(getZenlessDataFilePath('./FileCfg'), [], 'zenless', ['MonsterAITemplateTb.json']);
}
