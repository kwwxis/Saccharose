import "../../setup";
import {findTextMapIdByExactName} from "../textMapFinder/text_map_finder";
import {grep} from "../script_util";

function genOL(grepOutput: string, hideTl: boolean = false): string {
  let template = `==Other Languages==
{{Other Languages
|en      = {EN_official_name}
|zhs     = {CHS_official_name}
|zhs_rm  = {}
|zht     = {CHT_official_name}
|zht_rm  = {}
|zh_tl   = {}
|ja      = {JP_official_name}
|ja_rm   = {}
|ja_tl   = {}
|ko      = {KR_official_name}
|ko_rm   = {}
|ko_tl   = {}
|es      = {ES_official_name}
|es_tl   = {}
|fr      = {FR_official_name}
|fr_tl   = {}
|ru      = {RU_official_name}
|ru_tl   = {}
|th      = {TH_official_name}
|th_rm   = {}
|th_tl   = {}
|vi      = {VI_official_name}
|vi_tl   = {}
|de      = {DE_official_name}
|de_tl   = {}
|id      = {ID_official_name}
|id_tl   = {}
|pt      = {PT_official_name}
|pt_tl   = {}
}}`;
  if (hideTl) {
    template = template.split('\n').filter(s => !s.includes('_tl')).join('\n');
    template = template.replace('{{Other Languages', '{{Other Languages\n|hide_tl = yes');
  }
  grepOutput.trim().split('\n')
    .map(s => s.trim())
    .filter(s => !!s && s.length)
    .map(s => /^.*TextMap([A-Z]{2,3})\.json.*": "(.*)"/.exec(s))
    .map(x => ({lang: x[1], text: x[2]}))
    .forEach(x => {
      template = template.replace(`{${x.lang}_official_name}`, x.text);
    });
  return template.replaceAll('{}', '').replaceAll('\\"', '"').replace(/{F#([^}]+)}{M#([^}]+)}/g, '($1/$2)');
}

export async function ol_gen(name: string, hideTl: boolean = false): Promise<string> {
  let id = await findTextMapIdByExactName(name);
  let lines = await grep(`${id}`, './TextMap/', '-rnw');
  return genOL(lines.join('\n'), hideTl);
}

if (require.main === module) {
  (async () => {
    console.log(await ol_gen(`Akademiya Recommendation Letter`, false));
  })();
}