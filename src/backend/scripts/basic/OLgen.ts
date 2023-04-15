import '../../loadenv';
import { Control, getControl, normText } from '../script_util';
import { getTextMapItem, loadTextMaps } from '../textmap';
import { LANG_CODE_TO_WIKI_CODE, LANG_CODES, LangCode } from '../../../shared/types/dialogue-types';
import { isInt } from '../../../shared/util/numberUtil';
import { mwParse } from '../../../shared/mediawiki/mwParse';
import { MwTemplateNode } from '../../../shared/mediawiki/mwTypes';
import { pathToFileURL } from 'url';
import { Marker } from '../../../shared/util/highlightMarker';

function ol_gen_internal(textMapId: number, hideTl: boolean = false, addDefaultHidden: boolean = false, hideRm: boolean = false): {
  wikitext: string,
  warnings: string[],
} {
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
|tr      = {TR_official_name}
|tr_tl   = {}
|it      = {IT_official_name}
|it_tl   = {}
}}`;
  if (hideTl) {
    template = template.split('\n').filter(s => !s.includes('_tl')).join('\n');
  }
  if (hideRm) {
    template = template.split('\n').filter(s => !s.includes('_rm')).join('\n');
  }
  if (addDefaultHidden) {
    template = template.replace('{{Other Languages', '{{Other Languages|default_hidden=1');
  }
  const warnings: string[] = [];
  const olMap: {[code: string]: string} = {};
  for (let langCode of LANG_CODES) {
    if (langCode === 'CH') {
      continue;
    }

    let textInLang = getTextMapItem(langCode, textMapId) || '';

    if (textInLang.includes('|')) {
      textInLang = textInLang.replaceAll(/\|/g, '{{!}}');
      warnings.push(`The parameter value for <code>${LANG_CODE_TO_WIKI_CODE[langCode].toLowerCase()}</code> contains a non-template pipe character (<code>|</code>). It has been replaced with <code>{{!}}</code>.<br />If pipe character was part of a special code, then it'll require manual editor intervention.`)
    }

    olMap[langCode] = textInLang;

    let langText = normText(textInLang, langCode, true);

    if (langCode === 'CHS' || langCode === 'CHT' || langCode === 'KR' || langCode === 'JP') {
      // replacing this character at the request of kalexchu
      langText = langText.replace(/·/g, '・'); // neither are standard periods so no backlash is needed
    }

    if (/(?<!{){(?!{)/.test(langText)) {
      warnings.push(`The parameter value for <code>${LANG_CODE_TO_WIKI_CODE[langCode].toLowerCase()}</code> contains a non-template curly brace.<br />If this is a special code, then it'll require manual editor intervention.`)
    }
    if (langText.includes('#')) {
      warnings.push(`The parameter value for <code>${LANG_CODE_TO_WIKI_CODE[langCode].toLowerCase()}</code> contains a hash character (<code>#</code>).<br />If this is a special code, then it'll require manual editor intervention.`)
    }
    if (langText.includes('$')) {
      warnings.push(`The parameter value for <code>${LANG_CODE_TO_WIKI_CODE[langCode].toLowerCase()}</code> contains a dollar character (<code>$</code>).<br />If this is a special code, then it'll require manual editor intervention.`)
    }

    template = template.replace(`{${langCode}_official_name}`, langText);

    let isFullAscii = /^[\u0000-\u007f]*$/.test(textInLang);
    if (langCode === 'TH' && isFullAscii) {
      template = template.replace(/\|th_rm\s*=\s*\{}/, '');
      template = template.replace(/\|th_tl\s*=\s*\{}/, '');
    }
  }
  if (olMap['EN'] === olMap['ES']) {
    template = template.replace(/\|es_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['FR']) {
    template = template.replace(/\|fr_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['RU']) {
    template = template.replace(/\|ru_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['ID']) {
    template = template.replace(/\|id_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['TH']) {
    template = template.replace(/\|th_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['VI']) {
    template = template.replace(/\|vi_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['DE']) {
    template = template.replace(/\|de_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['ID']) {
    template = template.replace(/\|id_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['PT']) {
    template = template.replace(/\|pt_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['TR']) {
    template = template.replace(/\|tr_tl\s*=\s*\{}/, '');
  }
  if (olMap['EN'] === olMap['IT']) {
    template = template.replace(/\|it_tl\s*=\s*\{}/, '');
  }
  const wikitext = template.replaceAll('{}', '')
    .replaceAll('\\"', '"')
    .split('\n')
    .filter(s => !!s)
    .join('\n');
  return { wikitext, warnings };
}

export interface OLGenOptions {
  hideTl?: boolean,
  addDefaultHidden?: boolean,
  langCode?: LangCode,
  hideRm?: boolean,
}

export interface OLResult {
  textMapId: number,
  result: string,
  warnings: string[],
  markers: Marker[],
  templateNode?: MwTemplateNode;
  duplicateTextMapIds: number[];
}

export async function ol_gen(ctrl: Control, name: string, options: OLGenOptions = {}): Promise<OLResult[]> {
  if (isInt(name)) {
    return [await ol_gen_from_id(ctrl, parseInt(name), options)];
  }

  let idList: number[] = await ctrl.findTextMapIdsByExactName(name);
  if (!idList || !idList.length) {
    return [];
  }

  let allResults: OLResult[] = [];
  let seen: {[result: string]: OLResult} = {};

  for (let textMapId of idList) {
    let { wikitext: result, warnings } = ol_gen_internal(textMapId, options.hideTl, options.addDefaultHidden, options.hideRm);
    if (result.includes('{EN_official_name}')) {
      continue;
    }
    if (seen[result]) {
      seen[result].duplicateTextMapIds.push(textMapId);
      continue;
    }
    let olResult: OLResult = {textMapId, result, warnings, markers: [], duplicateTextMapIds: []};
    seen[result] = olResult;
    allResults.push(olResult);
  }
  return Array.from(allResults);
}

export async function ol_gen_from_id(ctrl: Control, textMapId: number, options: OLGenOptions = {}): Promise<OLResult> {
  if (!textMapId) {
    return null;
  }
  let { wikitext: result, warnings } = ol_gen_internal(textMapId, options.hideTl, options.addDefaultHidden, options.hideRm);
  return {textMapId, result, warnings, markers: [], duplicateTextMapIds: []};
}

export function add_ol_markers(olResults: OLResult[]): OLResult[] {
  for (let olResult of olResults) {
    let mwParseResult = mwParse(olResult.result);
    olResult.templateNode = mwParseResult.parts.find(p => p instanceof MwTemplateNode) as MwTemplateNode;
  }

  let diffKeys = [];

  for (let olResult of olResults) {
    for (let param of olResult.templateNode.params) {
      for (let otherOlResult of olResults) {
        if (otherOlResult == olResult) {
          continue;
        }
        let otherParam = otherOlResult.templateNode.getParam(param.key);
        if (otherParam && param.value !== otherParam.value) {
          if (!diffKeys.includes(param.key)) {
            diffKeys.push(param.key);
          }
        }
      }
    }
  }

  let diffKeyRegex = new RegExp('^(\\|(?:' + diffKeys.join('|') + ')\\s*=\\s*)(.*)$');

  for (let olResult of olResults) {
    let lineNum = 1;
    for (let line of olResult.result.split('\n')) {
      if (diffKeyRegex.test(line)) {
        let match = diffKeyRegex.exec(line);
        olResult.markers.push(new Marker('highlight', lineNum, match[1].length, match[1].length + match[2].length));
      }
      lineNum++;
    }
  }

  return olResults;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    await loadTextMaps(['EN', 'CHS']);
    console.log(await ol_gen(getControl(), `"Outlander Brigade!"`));

    console.log(await ol_gen(getControl(), `A letter given to you by Sumida.\\nGive this letter to Kama in Ritou.`))
    // console.log(await ol_gen(getControl(), `Master Chef: Vanarana`, {
    //   hideTl: true,
    // }));

//     let out = highlight_ol_differences([{
//       textMapId: 1861052848,
//       result: `{{Other Languages
// |en      = Iris
// |zhs     = 伊丽丝
// |zhs_rm  =
// |zht     = 伊麗絲
// |zht_rm  =
// |zh_tl   =
// |ja      = イリス
// |ja_rm   =
// |ja_tl   =
// |ko      = 이리스
// |ko_rm   =
// |ko_tl   =
// |es      = Iris
// |fr      = Iris
// |ru      = Ирис
// |ru_tl   =
// |th      = Iris
// |vi      = Iris
// |de      = Iris
// |id      = Iris
// |pt      = Iris
// |tr      = Iris
// |it      = Iris
// }}`
//   }, {
//       textMapId: 1892768677,
//       result: `{{Other Languages
// |en      = Iris
// |zhs     = 玉霞
// |zhs_rm  =
// |zht     = 玉霞
// |zht_rm  =
// |zh_tl   =
// |ja      = 玉霞
// |ja_rm   =
// |ja_tl   =
// |ko      = 옥희
// |ko_rm   =
// |ko_tl   =
// |es      = Iris
// |fr      = Iris
// |ru      = Юй Ся
// |ru_tl   =
// |th      = Iris
// |vi      = Iris
// |de      = Iris
// |id      = Iris
// |pt      = Yuxia
// |pt_tl   =
// |tr      = Iris
// |it      = Iris
// }}`
//     }]);
//
//     console.log(out[0].result);
//     console.log(out[1].result);
  })();
}