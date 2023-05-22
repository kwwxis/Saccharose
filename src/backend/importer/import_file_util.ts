import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import {promises as fsp} from 'fs';
import { LANG_CODES } from '../../shared/types/lang-types';
import { TextNormalizer } from '../domain/generic/genericNormalizers';
import { getTextMapRelPath } from '../loadenv';
import { isInt } from '../../shared/util/numberUtil';

const isOnePropObj = (o: any, key: string) => o && typeof o === 'object' && Object.keys(o).length === 1 && Object.keys(o)[0] === key;

const isEmptyObj = (o: any) => o && typeof o === 'object' && Object.keys(o).length === 0;

// Some text map keys are strings instead of numbers, which are then converted to numbers for the final TextMap
// Use this function to get the numeric text map hash from the string key.
function getStableHash(str: string): number {
  let hash1 = 5381n;
  let hash2 = 5381n;

  for (let i = 0; i < str.length && typeof str[i] !== 'undefined'; i += 2) {
    hash1 = ((hash1 << 5n) + hash1) ^ BigInt(str.charCodeAt(i));
    if (i + 1 < str.length) {
      hash2 = ((hash2 << 5n) + hash2) ^ BigInt(str.charCodeAt(i + 1));
    }
  }

  return Number(BigInt.asIntN(32, (hash1 + (hash2 * 1566083941n)) | 0n));
}

function normalizeRecord<T>(record: T): T {
  if (!record || typeof record !== 'object') {
    return record;
  }
  for (let key of Object.keys(record)) {
    let value = record[key];

    if (isOnePropObj(value, 'Hash')) {
      delete record[key];
      record[key = key + 'Hash'] = value['Hash'];

    } else if (isOnePropObj(value, 'Value')) {
      delete record[key];
      record[key = key + 'Value'] = value['Value'];

    } else if (Array.isArray(value) && value.length) {
      value = value.filter(v => !isEmptyObj(v)).map(v => normalizeRecord(v));
      record[key] = value;

      if (value.length && value.every(v => isOnePropObj(v, 'Value'))) {
        delete record[key];
        if (key.endsWith('List')) {
          key = key.slice(0, -4);
        }
        record[key = key + 'ValueList'] = value.map(v => v.Value);

      } else if (value.length && value.every(v => isOnePropObj(v, 'Hash'))) {
        delete record[key];
        if (key.endsWith('List')) {
          key = key.slice(0, -4);
        }
        record[key = key + 'HashList'] = value.map(v => v.Hash);
      }
    } else if (value && typeof value === 'object') {
      record[key] = normalizeRecord(value)
    }

    if ((key.endsWith('Hash') || key.includes('Name') || key.includes('Title') || key.includes('Desc')) && typeof record[key] === 'string') {
      record[key] = getStableHash(record[key]);
    }

    if (!key.endsWith('Hash') && (key.includes('Name') || key.includes('Title') || key.includes('Desc')) && typeof record[key] === 'number') {
      let prevKey = key;
      record[key = key + 'Hash'] = record[prevKey];
      delete record[prevKey];
    }

    if (key.endsWith('Hash') && !key.endsWith('TextMapHash') && typeof record[key] === 'number') {
      let prevKey = key;
      key = key.replace(/(TextmapID)?(Text)?(Id|Map)?Hash$/i, 'TextMapHash');
      record[key] = record[prevKey];
      delete record[prevKey];
    }
  }
  return record;
}

export async function importNormalize(jsonDir: string, skip: string[]) {
  const jsonsInDir = (await fsp.readdir(jsonDir)).filter(file => path.extname(file) === '.json');
  console.log('JSON DIR:', jsonDir);

  let numChanged: number = 0;

  for (let file of jsonsInDir) {
    if (skip.includes(file)) {
      continue;
    }

    const filePath = path.join(jsonDir, file);
    process.stdout.write(chalk.bold('Processing: ' + filePath));

    let fileData = await fsp.readFile(filePath, 'utf8');

    let json = JSON.parse(fileData);
    if (Array.isArray(json)) {
      json.forEach(row => normalizeRecord(row));
    } else {
      json = Object.values(json).map(row => normalizeRecord(row));
    }

    let newJson = [];
    for (let row of json) {
      if (!row || typeof row !== 'object') {
        newJson.push(row);
        continue;
      }

      let queue = [row];
      while (queue.length) {
        let curr = queue.shift();

        if (curr && typeof curr === 'object' && Object.keys(curr).every(key => isInt(key))) {
          queue.push(... Object.values(curr));
        } else {
          newJson.push(curr);
        }
      }
    }
    json = newJson;

    let newFileData = JSON.stringify(json, null, 2);

    // Convert primitive arrays to be single-line.
    newFileData = newFileData.replace(/\[(\s*(\d+|\d+\.\d+|"[^"]+"|true|false),?\s*)*]/g, fm => {
      let s = fm.slice(1, -1).split(',').map(s => s.trim()).join(', ');
      return s ? '[ ' + s + ' ]' : '[]';
    });

    if (newFileData !== fileData) {
      await fsp.writeFile(filePath, newFileData, 'utf8');
      console.log(chalk.blue(' (modified)'));
      numChanged++;
    } else {
      console.log(chalk.gray(' (unchanged)'));
    }
  }

  console.log(chalk.blue(`Done, modified ${numChanged} files.`));
}

export async function importPlainTextMap(getDataFilePath: (relPath: string) => string, normTextFn: TextNormalizer) {
  if (!fs.existsSync(getDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getDataFilePath('./TextMap/Plain/'));
  }

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;

    try {
      let textmap: {[hash: string]: string} = await fsp.readFile(getDataFilePath(getTextMapRelPath(langCode)), {encoding: 'utf8'}).then(data => {
        return Object.freeze(JSON.parse(data));
      });

      console.log(chalk.bold.underline('Creating PlainTextMap for ' + langCode));
      let hashList = [];
      let textList = [];

      for (let [hash, text] of Object.entries(textmap)) {
        hashList.push(hash);
        textList.push(normTextFn(text, langCode, true, true).replaceAll(/\r?\n/g, '\\n'));

        if (text.includes('{F#') || text.includes('{M#')) {
          hashList.push(hash);
          textList.push(normTextFn(text, langCode, true, true, 'male').replaceAll(/\r?\n/g, '\\n'));

          hashList.push(hash);
          textList.push(normTextFn(text, langCode, true, true, 'female').replaceAll(/\r?\n/g, '\\n'));
        }
      }

      console.log(`  Writing to PlainTextMap${langCode}_Text.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'), textList.join('\n'), 'utf8');
      console.log(`  Writing to PlainTextMap${langCode}_Hash.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'), hashList.join('\n'), 'utf8');

      textmap = null;
    } catch (e) {
      console.log(chalk.yellow('Could not process TextMap for ' + langCode + ' (may not exist)'));
    }
    console.log(chalk.gray('----------'));
  }
  console.log(chalk.blue('Done'));
}