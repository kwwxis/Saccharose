import '../../../loadenv.ts';
import { getGenshinControl } from '../../genshin/genshinControl.ts';
import { isInt, maybeInt } from '../../../../shared/util/numberUtil.ts';
import { mwParse } from '../../../../shared/mediawiki/mwParse.ts';
import { MwTemplateNode, MwCharSequence, MwEOL } from '../../../../shared/mediawiki/mwParseTypes.ts';
import { pathToFileURL } from 'url';
import { Marker } from '../../../../shared/util/highlightMarker.ts';
import { LANG_CODE_TO_WIKI_CODE, LANG_CODES, LangCode, TextMapHash } from '../../../../shared/types/lang-types.ts';
import { AbstractControl } from '../abstractControl.ts';
import { SbOut } from '../../../../shared/util/stringUtil.ts';
import { isUnset } from '../../../../shared/util/genericUtil.ts';
import { closeKnex } from '../../../util/db.ts';

async function ol_gen_internal(ctrl: AbstractControl,
                               textMapHash: TextMapHash,
                               opts: OLGenOptions): Promise<{
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
  if (opts.includeHeader) {
    sbOut.line('==Other Languages==');
  }
  if (opts.addDefaultHidden) {
    sbOut.line('{{Other Languages|default_hidden=1');
  } else {
    sbOut.line('{{Other Languages');
  }
  sbOut.setPropPad(opts.hideTl && opts.hideRm ? 5 : 9);
  for (let item of templateConfig) {
    if (ctrl.disabledLangCodes.has(item.langCode)) {
      continue;
    }
    const wikiCode = LANG_CODE_TO_WIKI_CODE[item.langCode].toLowerCase();
    sbOut.prop(wikiCode, `{${item.langCode}_official_name}`);

    if (item.rm && !opts.hideRm) {
      sbOut.prop(wikiCode + '_rm', `{}`);
    }
    if (item.tl && (item.langCode === 'CHS' || item.langCode === 'CHT')) {
      if (item.langCode === 'CHT' && !opts.hideTl) {
        sbOut.prop('zh_tl', '{}');
      }
    } else if (item.tl && !opts.hideTl) {
      sbOut.prop(wikiCode + '_tl', '{}');
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

    let rawText = await ctrl.getTextMapItem(langCode, textMapHash);

    if (isUnset(rawText) && langCode === 'EN') {
      return {wikitext: null, warnings: []};
    }

    rawText = rawText || '';

    olMap[langCode] = rawText;

    let langText = ctrl.normText(rawText, langCode, { decolor: true });

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

    if (langText.includes('|')) {
      let parsed = mwParse(langText);
      for (let part of parsed.parts) {
        if (part instanceof MwCharSequence) {
          part.content = part.content.replace(/\|/g, '<nowiki>|</nowiki>');
        }
      }
      langText = parsed.toString();
    }

    template = template.replace(`{${langCode}_official_name}`, langText);

    let isFullAscii = /^[\u0000-\u007f]*$/.test(rawText);
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
  includeHeader?: boolean,
}

export interface OLResult {
  textMapHash: TextMapHash,
  result: string,
  warnings: string[],
  markers: Marker[],
  templateNode?: MwTemplateNode;
  duplicateTextMapHashes: TextMapHash[];
  suppressMarkers?: boolean,
}

export interface OLCombinedResult {
  textMapHashList: TextMapHash[],
  result: string,
  templateNode: MwTemplateNode
}

export function ol_combine_results(olResults: OLResult[]): OLCombinedResult {
  if (olResults) {
    olResults = olResults.filter(x => !!x);
  }
  if (!olResults || olResults.length === 0){
    return {
      textMapHashList: [],
      result: '',
      templateNode: null
    }
  }
  if (olResults.length === 1) {
    return {
      textMapHashList: [olResults[0].textMapHash],
      result: olResults[0].result,
      templateNode: olResults[0].templateNode
    }
  }

  populateOlTemplateNode(olResults);

  const resultNode = new MwTemplateNode('Other Languages\n');

  for (let i = 0; i < olResults.length; i++) {
    const olResult = olResults[i];

    if (i > 0) {
      resultNode.addNode(new MwEOL('\n'));
    }

    for (let param of olResult.templateNode.params) {
      param = param.copy();
      param.key = `${i + 1}_${param.rawKey}`;
      resultNode.addParam(param);
    }
  }
  return {
    textMapHashList: olResults.map(r => r.textMapHash),
    result: resultNode.toString(),
    templateNode: resultNode
  };
}

export async function ol_gen(ctrl: AbstractControl, name: string, options: OLGenOptions = {}): Promise<OLResult[]> {
  const textMapHashResult: OLResult = await ol_gen_from_id(ctrl, maybeInt(name), options);
  if (textMapHashResult) {
    textMapHashResult.suppressMarkers = true;
    return [textMapHashResult];
  }

  const textMapHashList: TextMapHash[] = await ctrl.findTextMapHashesByExactName(name);
  if (!textMapHashList.length) {
    if (name.includes(',') || name.includes(';')) {
      const multiHashResults: OLResult[] = [];
      for (let sub of name.split(/[,;]/)) {
        if (sub.trim().length && /^[a-zA-Z0-9_\-]+$/.test(sub.trim())) {
          const textMapHashResult: OLResult = await ol_gen_from_id(ctrl, maybeInt(sub), options);
          if (textMapHashResult) {
            textMapHashResult.suppressMarkers = true;
            multiHashResults.push(textMapHashResult);
          }
        }
      }
      return multiHashResults;
    }
    return [];
  }

  const allResults: OLResult[] = [];
  const seen: {[result: string]: OLResult} = {};

  for (let textMapHash of textMapHashList) {
    let { wikitext: result, warnings } = await ol_gen_internal(ctrl, textMapHash, options);
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
  let { wikitext: result, warnings } = await ol_gen_internal(ctrl, textMapHash, options);
  if (!result || !result.trim()) {
    return null;
  }
  return {textMapHash, result, warnings, markers: [], duplicateTextMapHashes: []};
}

function populateOlTemplateNode(olResults: OLResult[]) {
  for (let olResult of olResults) {
    if (!olResult.templateNode) {
      let mwParseResult = mwParse(olResult.result);
      olResult.templateNode = mwParseResult.findTemplateNodes()[0];
    }
  }
}

export function add_ol_markers(olResults: OLResult[]): OLResult[] {
  populateOlTemplateNode(olResults);

  let diffKeys = [];

  for (let olResult of olResults) {
    if (olResult.suppressMarkers) {
      continue;
    }
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
    if (olResult.suppressMarkers) {
      continue;
    }
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
    //console.log(await ol_gen(getGenshinControl(), `"Outlander Brigade!"`));

    const res1 = await ol_gen(getGenshinControl(), `Nahida`);
    const res2 = await ol_gen(getGenshinControl(), `Furina`);
    const comb = await ol_combine_results([... res1, ... res2]);
    console.log(comb.toString());

    await closeKnex();
  })();
}
