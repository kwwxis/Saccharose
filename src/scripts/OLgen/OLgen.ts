import { LangCode } from "@types";
import "../../setup";
import {Control, getControl, grep} from "../script_util";

function ol_gen_internal(grepOutput: string, hideTl: boolean = false, addDefaultHidden: boolean = false): string {
  let template = `{{Other Languages
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
  }
  if (addDefaultHidden) {
    template = template.replace('{{Other Languages', '{{Other Languages\n|default_hidden = 1');
  }
  let olMap: {[code: string]: string} = {};
  grepOutput.trim().split('\n')
    .map(s => s.trim())
    .filter(s => !!s && s.length)
    .map(s => /^.*TextMap([A-Z]{2,3})\.json.*": "(.*)"/.exec(s))
    .map(x => ({lang: x[1], text: x[2]}))
    .forEach(x => {
      olMap[x.lang] = x.text;
      template = template.replace(`{${x.lang}_official_name}`, x.text);
      let isFullAscii = /^[\u0000-\u007f]*$/.test(x.text);
      if (x.lang === 'TH' && isFullAscii) {
        template = template.replace(/\|th_rm\s*=\s*\{\}/, '');
        template = template.replace(/\|th_tl\s*=\s*\{\}/, '');
      }
    });
  if (olMap['EN'] === olMap['ID']) {
    template = template.replace(/\|id_tl\s*=\s*\{\}/, '');
  }
  return template.replaceAll('{}', '').replaceAll('\\"', '"').replace(/{F#([^}]+)}{M#([^}]+)}/g, '($1/$2)').split('\n').filter(s => !!s).join('\n');
}

export async function ol_gen(ctrl: Control, name: string, hideTl: boolean = false, addDefaultHidden: boolean = false, langCode: LangCode = null): Promise<string> {
  let id = await ctrl.findTextMapIdByExactName(langCode || ctrl.inputLangCode, name);
  if (!id) {
    return null;
  }
  let lines = await grep(`${id}`, './TextMap/', '-rnw');
  let result = ol_gen_internal(lines.join('\n'), hideTl, addDefaultHidden);
  if (result.includes('{EN_official_name}')) {
    return null;
  }
  return result;
}

if (require.main === module) {
  (async () => {
    //console.log(await ol_gen(getControl(), `"Outlander Brigade!"`, true));
    console.log(await ol_gen(getControl(), `Master Chef: Vanarana`, true));
  })();
}