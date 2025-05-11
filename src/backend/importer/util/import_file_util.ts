import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import {promises as fsp} from 'fs';
import { LANG_CODES } from '../../../shared/types/lang-types.ts';
import { getTextMapRelPath } from '../../loadenv.ts';
import { AbstractControl } from '../../domain/abstract/abstractControl.ts';
import { NormTextOptions } from '../../domain/abstract/genericNormalizers.ts';
import XXH from 'xxhashjs';
import JSONBigImport from '../../util/json-bigint';
import { isInt } from '../../../shared/util/numberUtil.ts';

const JSONbig = JSONBigImport({ useNativeBigInt: true, objectProto: true});

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

function normalizeRecordForHSR<T>(record: T): T {
  if (!record || typeof record !== 'object') {
    return record;
  }
  for (let key of Object.keys(record)) {
    let value = record[key];

    if (isOnePropObj(value, 'Hash')) {
      delete record[key];
      value = value['Hash'];
      record[key = key + 'Hash'] = value;

    } else if (isOnePropObj(value, 'Value')) {
      delete record[key];
      value = value['Value'];
      record[key = key + 'Value'] = value;

    } else if (Array.isArray(value) && value.length) {
      value = value.filter(v => !isEmptyObj(v)).map(v => {
        return normalizeRecordForHSR(v);
      });
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
      record[key] = normalizeRecordForHSR(value)
    }

    if ((key.endsWith('Hash') || key.includes('Name') || key.includes('Title') || key.includes('Desc'))
      && typeof record[key] === 'string' && !isInt(record[key])) {
      record[key] = XXH.h64(record[key], 0).toString(10);
    }

    if (!key.endsWith('Hash') && (key.includes('Name') || key.includes('Title') || key.includes('Desc')) && isInt(record[key])) {
      let prevKey = key;
      record[key = key + 'Hash'] = record[prevKey];
      delete record[prevKey];
    }

    if (key.endsWith('Hash') && !key.endsWith('TextMapHash') && isInt(record[key])) {
      let prevKey = key;
      key = key.replace(/(TextmapID)?(Text)?(Id|Map)?Hash$/i, 'TextMapHash');
      record[key] = record[prevKey];
      delete record[prevKey];
    }
  }
  return record;
}

export async function importNormalize(jsonDir: string, skip: string[], game: 'genshin' | 'hsr' | 'zenless' | 'wuwa', skipReformatPrimitiveArray: string[] = []) {
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

    let json = JSONbig.parse(fileData);

    // Stringify and parse again to convert bigints to string via replacer
    json = JSON.parse(JSON.stringify(
      json,
      (_, v) => typeof v === 'bigint' ? v.toString() : v
    ))

    if (game === 'hsr') {
      if (Array.isArray(json)) {
        json.forEach(row => normalizeRecordForHSR(row));
      } else {
        json = Object.values(json).map(row => normalizeRecordForHSR(row));
      }
    }
    if (game === 'zenless') {
      let newJson = [];

      if (typeof json === 'object' && !Array.isArray(json)) {
        newJson = Object.values(json)[0] as any;
      } else if (Array.isArray(json)) {
        newJson = json;
      }

      json = newJson;
    }

    let newFileData = JSON.stringify(
      json,
      (_, v) => typeof v === 'bigint' ? v.toString() : v,
      2);

    if (!skipReformatPrimitiveArray.includes(file)) {
      // Convert primitive arrays to be single-line.
      newFileData = reformatPrimitiveArrays(newFileData);
    }

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

export function reformatPrimitiveArrays(jsonStr: string) {
  return jsonStr.replace(/\[(\s*(\d+(\.\d+)?|"[^"]+"|true|false),?\n\s*)*]/g, fm => {
    let s = fm.slice(1, -1).split(',').map(s => s.trim()).join(', ');
    return s ? '[ ' + s + ' ]' : '[]';
  });
}

export async function importPlainTextMap(ctrl: AbstractControl, getDataFilePath: (relPath: string) => string) {
  if (!fs.existsSync(getDataFilePath('./TextMap/Plain/'))) {
    fs.mkdirSync(getDataFilePath('./TextMap/Plain/'));
  }

  for (let langCode of LANG_CODES) {
    if (langCode === 'CH')
      continue;
    if (ctrl.disabledLangCodes.has(langCode))
      continue;

    try {
      let textmap: {[hash: string]: string} = await fsp.readFile(getDataFilePath(getTextMapRelPath(langCode)), {encoding: 'utf8'}).then(data => {
        return Object.freeze(JSON.parse(data));
      });

      console.log(chalk.bold.underline('Creating PlainTextMap for ' + langCode));
      let hashList: string[] = []; // entry format: "<hash>" or "<hash>,<type>"
      let textList: string[] = [];

      for (let [hash, text] of Object.entries(textmap)) {
        hash = hash.replaceAll(/\r?\n/g, '');

        hashList.push(hash+',raw');
        textList.push(text.replaceAll(/\r?\n/g, '\\n'));

        let variations: NormTextOptions[] = [
          { decolor: true, plaintext: true, plaintextMcMode: 'both' }
        ];

        if (text.includes('{F#') || text.includes('{M#')) {
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'male' });
          variations.push({ decolor: true, plaintext: true, plaintextMcMode: 'female' });
        }

        const addSingleVariation = (variation: NormTextOptions) => {
          variations.push(... variations.map(v => Object.assign({}, v, variation)));
        };

        if (text.includes('—')) {
          addSingleVariation({ plaintextDash: '—' });
        }

        for (let variation of variations) {
          hashList.push(hash);
          textList.push(ctrl.normText(text, langCode, variation).replaceAll(/\r?\n/g, '\\n'));
        }
      }

      console.log(`  Writing to PlainTextMap${langCode}_Text.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Text.dat'), textList.join('\n'), 'utf8');
      console.log(`  Writing to PlainTextMap${langCode}_Hash.dat`);
      fs.writeFileSync(getDataFilePath('./TextMap/Plain/PlainTextMap' + langCode + '_Hash.dat'), hashList.join('\n'), 'utf8');

      textmap = null;
    } catch (e) {
      console.log(chalk.yellow('Could not process TextMap for ' + langCode + ' (may not exist) -- ' + getDataFilePath(getTextMapRelPath(langCode))));
      if (!String(e).includes('no such file or directory')) {
        console.error(e);
      }
    }
    console.log(chalk.gray('----------'));
  }
  console.log(chalk.blue('Done'));
}
