/**
 * Generate Quest & Dialog Excels
 *
 * Specifically these:
 *  - MainQuestExcelConfigData
 *  - QuestExcelConfigData
 *  - TalkExcelConfigData
 *  - DialogExcelConfigData
 *
 * It also generates this too: DialogUnparentedExcelConfigData
 * Which is a custom file that associates dialogs to a main quest for dialogs that aren't part of a talk.
 *
 * === DEPENDENCIES ===
 *
 * Requires Node.js and ts-node.
 *
 * After installing Node.js, you can install ts-node globall with: npm install -g ts-node
 *
 * === USAGE ===
 *
 * This file must be placed in the genshin data repository!
 *
 * Run with ts-node:
 *  ts-node ./generate-quest-dialog-excels.ts <repo-dir>
 *
 * For example:
 *   ts-node ./generate-quest-dialog-excels.ts 'C:/git/AnimeGameData'
 *
 */

import fs, { promises as fsp } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import * as process from 'process';

// region Walk Sync
// --------------------------------------------------------------------------------------------------------------
function* walkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* walkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}
// endregion

// region String Utils
// --------------------------------------------------------------------------------------------------------------
export function isStringNotBlank(str: any): boolean {
  return !!str && typeof str === 'string' && !!str.trim().length;
}

export function isStringBlank(str: any): boolean {
  return !isStringNotBlank(str);
}

export const whitespace: string[] = [
  ' ',
  '\n',
  '\r',
  '\t',
  '\f',
  '\x0b',
  '\xa0',
  '\u2000',
  '\u2001',
  '\u2002',
  '\u2003',
  '\u2004',
  '\u2005',
  '\u2006',
  '\u2007',
  '\u2008',
  '\u2009',
  '\u200a',
  '\u200b',
  '\u2028',
  '\u2029',
  '\u3000',
];

export const whitespaceCombined: string = whitespace.join('');

/**
 * PHP trim() equivalent
 * @returns {string}
 */
export function trim(str: string, char_mask?: string, mode?: number): string {
  if (!str) {
    return str;
  }

  if (typeof str !== 'string') {
    str = String(str);
  }

  const l = str.length;
  let i = 0;

  if (!l) return '';

  if (char_mask) {
    char_mask = char_mask + '';
    if (!char_mask.length) return str;
  } else {
    char_mask = whitespaceCombined;
  }

  mode = mode || 1 | 2;

  // noinspection JSBitwiseOperatorUsage
  if (mode & 1) {
    for (i = 0; i < l; i++) {
      if (char_mask.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
    if (i == l) return '';
  }

  // noinspection JSBitwiseOperatorUsage
  if (mode & 2) {
    for (i = l - 1; i >= 0; i--) {
      if (char_mask.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
    if (i == -1) return '';
  }

  return str;
}
// endregion

// region Number Utils
// --------------------------------------------------------------------------------------------------------------
export function isInteger(value: any): boolean {
  if (typeof value === 'number') {
    return Math.trunc(value) === value;
  } else if (typeof value === 'string') {
    return /^-?\d+$/.test(value);
  } else {
    return isInteger(String(value));
  }
}

export function isInt(value: any): boolean {
  return isInteger(value);
}
// endregion

// region Object Utils
// --------------------------------------------------------------------------------------------------------------
export function isUnset(x: any): boolean {
  return typeof x === 'undefined' || x === null;
}

export function resolveObjectPath(o: any, s: string, mode: 'get' | 'set' | 'delete' = 'get', newValue?: any): any {
  if (typeof s !== 'string') return undefined;
  s = s.replace(/\.?\[([^\]]+)]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, '');           // strip a leading dot
  if (isStringBlank(s)) return o;
  let a = s.split('.');
  let lastIdx = a.length - 1;
  for (let i = 0; i < a.length; i++) {
    let k = a[i];
    let isLast = i === lastIdx;
    if (typeof o === 'object' && k in o) {
      let v = o[k];
      if (isLast && mode === 'delete') {
        delete o[k];
      }
      if (isLast && mode === 'set') {
        o[k] = newValue;
      }
      if (!isLast && mode === 'set' && !v) {
        o[k] = {};
        v = o[k];
      }
      o = v;
    } else if (Array.isArray(o) && ['#ALL', '#EACH', '#EVERY'].includes(k.toUpperCase())) {
      return o.map(item => resolveObjectPath(item, a.slice(i + 1).join('.'), mode, newValue)).flat(Infinity);
    } else {
      if (mode === 'set') {
        if (isLast) {
          o[k] = newValue;
        } else {
          let nextKeyUC = a[i+1].toUpperCase();
          if (isInt(nextKeyUC) || ['#ALL', '#EACH', '#EVERY'].includes(nextKeyUC)) {
            o[k] = [];
          } else {
            o[k] = {};
          }
          o = o[k];
          continue;
        }
      }
      return undefined;
    }
  }
  return o;
}

export function compare<T>(a: T, b: T, field?: string|SortComparator<T>|null, nullsLast: boolean = false): number {
  if (isUnset(a) && !isUnset(b)) return nullsLast ? 1 : -1;
  if (!isUnset(a) && isUnset(b)) return nullsLast ? -1 : 1;
  if (isUnset(a) && isUnset(b)) return 0;

  let reverse = false;
  if (typeof field === 'string' && field.startsWith('-')) {
    reverse = true;
    field = field.slice(1);
  }
  if (typeof field === 'string' && field.startsWith('+')) {
    field = field.slice(1);
  }

  let n = 0;

  if (typeof a === 'string' && typeof b === 'string') {
    n = trim(a, `"`).localeCompare(trim(b, `"`));
  } else if (typeof a === 'number' && typeof b === 'number') {
    n = a - b;
  } else if (typeof a === 'boolean' && typeof b === 'boolean') {
    n = (a ? 1 : -1) - (b ? 1 : -1);
  } else if (typeof a === 'object' && typeof b === 'object' && !!field) {
    if (typeof field === 'function') {
      n = field(a, b);
    } else {
      n = compare(resolveObjectPath(a, field), resolveObjectPath(b, field), field, reverse ? !nullsLast : nullsLast);
    }
  } else {
    if (a < b) n = -1;
    if (a > b) n = 1;
  }
  return reverse ? -n : n;
}

export type SortComparator<T> = (a: T, b: T) => number;

export function sort<T>(array: T[], ...fields: (string|SortComparator<T>)[]): T[] {
  if (!Array.isArray(array)) throw new Error('Must be an array!');
  array.sort((a: T, b: T) => {
    if (!fields || !fields.length)
      return compare(a, b, null, true);
    return fields.map(field => compare(a, b, field, true)).find(n => n !== 0) || 0;
  });
  return array;
}
// endregion

// region Main Function
// --------------------------------------------------------------------------------------------------------------
export async function generateQuestDialogExcels(repoRoot: string) {
  const binOutputPath: string = path.resolve(repoRoot, './BinOutput');
  const excelDirPath: string = path.resolve(repoRoot, './ExcelBinOutput');

  if (!fs.existsSync(binOutputPath)) throw new Error('BinOutput path does not exist!');
  if (!fs.existsSync(excelDirPath)) throw new Error('ExcelBinOutput path does not exist!');

  const binOutputQuestPath: string = path.resolve(binOutputPath, './Quest');
  const binOutputTalkPath: string = path.resolve(binOutputPath, './Talk');

  if (!fs.existsSync(binOutputQuestPath)) throw new Error('BinOutput/Quest path does not exist!');
  if (!fs.existsSync(binOutputTalkPath)) throw new Error('BinOutput/Talk path does not exist!');

  const mainQuestExcelArray: any[] = [];
  const questExcelArray: any[] = [];
  const talkExcelArray: any[] = [];
  const dialogExcelArray: any[] = [];
  const dialogUnparentedExcelArray: any[] = [];

  const mainQuestById: { [id: string]: any } = {};
  const questExcelById: { [id: string]: any } = {};
  const talkExcelById: { [id: string]: any } = {};
  const dialogExcelById: { [id: string]: any } = {};

  // ----------------------------------------------------------------------
  // Enqueue Functions

  function enqueueMainQuestExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (mainQuestById[obj.id]) {
      console.log('Got duplicate of main quest ' + obj.id);
      Object.assign(mainQuestById[obj.id], obj);
      return;
    }

    if (Array.isArray(obj.dialogList)) {
      for (let dialog of obj.dialogList) {
        dialogUnparentedExcelArray.push({ MainQuestId: obj.id, DialogId: dialog.id });
      }
    }

    obj = Object.assign({}, obj);
    delete obj['talks'];
    delete obj['dialogList'];
    delete obj['subQuests'];

    if (!obj.rewardIdList) {
      obj.rewardIdList = [];
    }
    if (!obj.suggestTrackMainQuestList) {
      obj.suggestTrackMainQuestList = [];
    }
    if (!obj.specialShowRewardId) {
      obj.specialShowRewardId = [];
    }
    if (!obj.specialShowCondIdList) {
      obj.specialShowCondIdList = [];
    }

    mainQuestExcelArray.push(obj);
    mainQuestById[obj.id] = obj;
  }

  function enqueueQuestExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (questExcelById[obj.subId]) {
      console.log('Got duplicate of quest ' + obj.subId);
      Object.assign(questExcelById[obj.subId], obj);
      return;
    }
    questExcelArray.push(obj);
    questExcelById[obj.subId] = obj;
  }

  function enqueueTalkExcel(obj: any) {
    if (!obj) {
      return;
    }
    if (talkExcelById[obj.id]) {
      //console.log('Got duplicate of talk ' + obj.id);
      Object.assign(talkExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextTalks) {
      obj.nextTalks = [];
    }
    if (!obj.npcId) {
      obj.npcId = [];
    }

    talkExcelArray.push(obj);
    talkExcelById[obj.id] = obj;
  }

  function enqueueDialogExcel(obj: any, extraProps: any = {}) {
    if (!obj) {
      return;
    }
    if (dialogExcelById[obj.id]) {
      //console.log('Got duplicate of dialog ' + obj.id);
      Object.assign(dialogExcelById[obj.id], obj);
      return;
    }

    if (!obj.nextDialogs) {
      obj.nextDialogs = [];
    }
    if (!obj.talkRole) {
      obj.talkRole = {};
    }

    dialogExcelArray.push(Object.assign(obj, extraProps));
    dialogExcelById[obj.id] = obj;
  }

  // ----------------------------------------------------------------------
  // Process Functions

  function processJsonObject(json: any) {
    if (!json) {
      return;
    }
    if (json.initDialog) {
      enqueueTalkExcel(json);
    }
    if (json.talkRole) {
      enqueueDialogExcel(json);
    }
    if (Array.isArray(json.dialogList)) {
      let extraProps: any = {};
      if (json.talkId) {
        extraProps.talkId = json.talkId;
      }
      if (json.type) {
        extraProps.talkType = json.type;
      }
      json.dialogList.forEach((obj: any) => enqueueDialogExcel(obj, extraProps));
    }
    if (Array.isArray(json.talks)) {
      json.talks.forEach((obj: any) => enqueueTalkExcel(obj));
    }
    if (Array.isArray(json.subQuests)) {
      json.subQuests.forEach((obj: any) => enqueueQuestExcel(obj));
    }
  }

  // ----------------------------------------------------------------------
  // Process Loop Stage

  console.log('Processing BinOutput/Quest');
  for (let fileName of walkSync(binOutputQuestPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    processJsonObject(json);
    enqueueMainQuestExcel(json);
  }

  console.log('Processing BinOutput/Talk');
  for (let fileName of walkSync(binOutputTalkPath)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }
    let json = await fsp.readFile(fileName, { encoding: 'utf8' }).then(data => JSON.parse(data));
    processJsonObject(json);
    if (json.id && json.type && json.subQuests) {
      enqueueMainQuestExcel(json);
    }
  }

  // ----------------------------------------------------------------------
  // Sort Stage

  console.log('Sorting MainQuestExcelConfigData');
  sort(mainQuestExcelArray, 'id');

  console.log('Sorting QuestExcelConfigData');
  sort(questExcelArray, 'id');

  console.log('Sorting TalkExcelConfigData');
  sort(talkExcelArray, 'id');

  console.log('Sorting DialogExcelConfigData');
  sort(dialogExcelArray, 'id');

  console.log('Sorting DialogUnparentedExcelConfigData');
  sort(dialogUnparentedExcelArray, 'MainQuestId', 'DialogId');

  // ----------------------------------------------------------------------
  // Write Stage

  console.log('Writing to MainQuestExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './MainQuestExcelConfigData.json'), JSON.stringify(mainQuestExcelArray, null, 2));

  console.log('Writing to QuestExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './QuestExcelConfigData.json'), JSON.stringify(questExcelArray, null, 2));

  console.log('Writing to TalkExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './TalkExcelConfigData.json'), JSON.stringify(talkExcelArray, null, 2));

  console.log('Writing to DialogExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './DialogExcelConfigData.json'), JSON.stringify(dialogExcelArray, null, 2));

  console.log('Writing to DialogUnparentedExcelConfigData');
  fs.writeFileSync(path.resolve(excelDirPath, './DialogUnparentedExcelConfigData.json'), JSON.stringify(dialogUnparentedExcelArray, null, 2));

  // ----------------------------------------------------------------------

  console.log('Done');
}
// endregion

// region CLI
// --------------------------------------------------------------------------------------------------------------
async function runFromCli() {
  if (process.argv.length <= 2) {
    console.error('Not enough parameters! First parameter must be path to genshin data repository directory.');
    process.exit(1);
  }

  const repoDir: string = process.argv[2];
  if (!fs.existsSync(repoDir)) {
    console.error('Repository directory does not exist! -- ' + repoDir);
    process.exit(1);
  }

  await generateQuestDialogExcels(repoDir);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runFromCli();
}
// endregion