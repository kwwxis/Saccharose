import { LangCode, LANG_CODES } from "@types";
import "../../setup";
import {Control, getControl, grep} from "../script_util";
import { getTextMapItem } from "../textmap";

function ol_gen_internal(textMapId: number, hideTl: boolean = false, addDefaultHidden: boolean = false): string {
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
  for (let langCode of LANG_CODES) {
    let textInLang = getTextMapItem(langCode, textMapId);
    olMap[langCode] = textInLang;

    template = template.replace(`{${langCode}_official_name}`, textInLang);

    let isFullAscii = /^[\u0000-\u007f]*$/.test(textInLang);
    if (langCode === 'TH' && isFullAscii) {
      template = template.replace(/\|th_rm\s*=\s*\{\}/, '');
      template = template.replace(/\|th_tl\s*=\s*\{\}/, '');
    }
  }
  if (olMap['EN'] === olMap['ES']) {
    template = template.replace(/\|es_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['FR']) {
    template = template.replace(/\|fr_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['RU']) {
    template = template.replace(/\|ru_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['ID']) {
    template = template.replace(/\|id_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['TH']) {
    template = template.replace(/\|th_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['VI']) {
    template = template.replace(/\|vi_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['DE']) {
    template = template.replace(/\|de_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['ID']) {
    template = template.replace(/\|id_tl\s*=\s*\{\}/, '');
  }
  if (olMap['EN'] === olMap['PT']) {
    template = template.replace(/\|pt_tl\s*=\s*\{\}/, '');
  }
  return template.replaceAll('{}', '').replaceAll('\\"', '"').replace(/{F#([^}]+)}{M#([^}]+)}/g, '($1/$2)').split('\n').filter(s => !!s).join('\n');
}

export async function ol_gen(ctrl: Control, name: string, hideTl: boolean = false, addDefaultHidden: boolean = false, langCode: LangCode = null): Promise<string[]> {
  let idList: number[] = await ctrl.findTextMapIdListByExactName(langCode || ctrl.inputLangCode, name);
  if (!idList || !idList.length) {
    return [];
  }
  let allResults = new Set<string>();
  for (let id of idList) {
    let result = ol_gen_internal(id, hideTl, addDefaultHidden);
    if (result.includes('{EN_official_name}')) {
      continue;
    }
    allResults.add(result);
  }
  return Array.from(allResults);
}

if (require.main === module) {
  (async () => {
    //console.log(await ol_gen(getControl(), `"Outlander Brigade!"`, true));
    console.log(await ol_gen(getControl(), `Master Chef: Vanarana`, true));
  })();
}