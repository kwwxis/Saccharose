import '../../../loadenv';
import { getGenshinControl } from '../../genshin/genshinControl';
import { isInt, maybeInt } from '../../../../shared/util/numberUtil';
import { mwParse } from '../../../../shared/mediawiki/mwParse';
import { MwTemplateNode } from '../../../../shared/mediawiki/mwTypes';
import { pathToFileURL } from 'url';
import { Marker } from '../../../../shared/util/highlightMarker';
import { LANG_CODE_TO_WIKI_CODE, LANG_CODES, LangCode, TextMapHash } from '../../../../shared/types/lang-types';
import { AbstractControl } from '../../abstractControl';
import { SbOut } from '../../../../shared/util/stringUtil';
import { isUnset } from '../../../../shared/util/genericUtil';

async function ol_gen_internal(ctrl: AbstractControl, textMapHash: TextMapHash, hideTl: boolean = false, addDefaultHidden: boolean = false, hideRm: boolean = false): Promise<{
  wikitext: string,
  warnings: string[],
}> {
  const templateConfig: {langCode: LangCode, rm: boolean, tl: boolean}[] = [
    { langCode: 'EN', rm: false, tl: false },
    { langCode: 'CHS', rm: true, tl: true },
    { langCode: 'CHT', rm: true, tl: true },
    { langCode: 'JP', rm: true, tl: true },
    { langCode: 'KR', rm: true, tl: true },
    { langCode: 'ES', rm: false, tl: true },
    { langCode: 'FR', rm: false, tl: true },
    { langCode: 'RU', rm: false, tl: true },
    { langCode: 'TH', rm: true, tl: true },
    { langCode: 'VI', rm: false, tl: true },
    { langCode: 'DE', rm: false, tl: true },
    { langCode: 'ID', rm: false, tl: true },
    { langCode: 'PT', rm: false, tl: true },
    { langCode: 'TR', rm: false, tl: true },
    { langCode: 'IT', rm: false, tl: true },
  ];
  let sbOut = new SbOut();
  if (addDefaultHidden) {
    sbOut.line('{{Other Languages|default_hidden=1');
  } else {
    sbOut.line('{{Other Languages');
  }
  for (let item of templateConfig) {
    if (ctrl.disabledLangCodes.has(item.langCode)) {
      continue;
    }
    const wikiCode = LANG_CODE_TO_WIKI_CODE[item.langCode].toLowerCase();
    sbOut.line('|' + wikiCode.padEnd(8, ' ') + `= {${item.langCode}_official_name}`);

    if (item.rm && !hideRm) {
      sbOut.line('|' + (wikiCode + '_rm').padEnd(8, ' ') + `= {}`);
    }
    if (item.tl && (item.langCode === 'CHS' || item.langCode === 'CHT')) {
      if (item.langCode === 'CHT' && !hideTl) {
        sbOut.line('|' + ('zh_tl').padEnd(8, ' ') + `= {}`);
      }
    } else if (item.tl && !hideTl) {
      sbOut.line('|' + (wikiCode + '_tl').padEnd(8, ' ') + `= {}`);
    }
  }
  sbOut.line('}}')

  let template = sbOut.toString();
  const warnings: string[] = [];
  const olMap: {[code: string]: string} = {};
  for (let langCode of LANG_CODES) {
    if (langCode === 'CH' || ctrl.disabledLangCodes.has(langCode)) {
      continue;
    }

    let textInLang = await ctrl.getTextMapItem(langCode, textMapHash);

    if (isUnset(textInLang) && langCode === 'EN') {
      return {wikitext: null, warnings: []};
    }

    textInLang = textInLang || '';

    if (textInLang.includes('|')) {
      textInLang = textInLang.replaceAll(/\|/g, '{{!}}');
      warnings.push(`The parameter value for <code>${LANG_CODE_TO_WIKI_CODE[langCode].toLowerCase()}</code> contains a non-template pipe character (<code>|</code>). It has been replaced with <code>{{!}}</code>.<br />If pipe character was part of a special code, then it'll require manual editor intervention.`)
    }

    olMap[langCode] = textInLang;

    let langText = ctrl.normText(textInLang, langCode, true);

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
  textMapHash: TextMapHash,
  result: string,
  warnings: string[],
  markers: Marker[],
  templateNode?: MwTemplateNode;
  duplicateTextMapHashes: TextMapHash[];
}

export async function ol_gen(ctrl: AbstractControl, name: string, options: OLGenOptions = {}): Promise<OLResult[]> {
  const maybeIdResult = await ol_gen_from_id(ctrl, maybeInt(name), options);
  if (maybeIdResult) {
    return [maybeIdResult];
  }

  let textMapHashList: TextMapHash[] = await ctrl.findTextMapHashesByExactName(name);
  if (!textMapHashList || !textMapHashList.length) {
    return [];
  }

  let allResults: OLResult[] = [];
  let seen: {[result: string]: OLResult} = {};

  for (let textMapHash of textMapHashList) {
    let { wikitext: result, warnings } = await ol_gen_internal(ctrl, textMapHash, options.hideTl, options.addDefaultHidden, options.hideRm);
    if (!result || result.includes('{EN_official_name}')) {
      continue;
    }
    if (seen[result]) {
      seen[result].duplicateTextMapHashes.push(textMapHash);
      continue;
    }
    let olResult: OLResult = {textMapHash: textMapHash, result, warnings, markers: [], duplicateTextMapHashes: []};
    seen[result] = olResult;
    allResults.push(olResult);
  }
  return Array.from(allResults);
}

export async function ol_gen_from_id(ctrl: AbstractControl, textMapHash: TextMapHash, options: OLGenOptions = {}): Promise<OLResult> {
  if (!textMapHash) {
    return null;
  }
  let { wikitext: result, warnings } = await ol_gen_internal(ctrl, textMapHash, options.hideTl, options.addDefaultHidden, options.hideRm);
  if (!result || !result.trim()) {
    return null;
  }
  return {textMapHash, result, warnings, markers: [], duplicateTextMapHashes: []};
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
    console.log(await ol_gen(getGenshinControl(), `"Outlander Brigade!"`));

    console.log(await ol_gen(getGenshinControl(), `A letter given to you by Sumida.\\nGive this letter to Kama in Ritou.`))
    // console.log(await ol_gen(getControl(), `Master Chef: Vanarana`, {
    //   hideTl: true,
    // }));

//     let out = highlight_ol_differences([{
//       textMapHash: 1861052848,
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
//       textMapHash: 1892768677,
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