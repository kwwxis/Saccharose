import path from 'path';
import chalk from 'chalk';
import { promises as fsp } from 'fs';
import XXH from 'xxhashjs';
import { isInt } from '../../../shared/util/numberUtil.ts';
import { isUnset } from '../../../shared/util/genericUtil.ts';
import { reformatPrimitiveArrays } from '../../../shared/util/stringUtil.ts';
import { parseJsonConvertingBigIntsToStrings } from '../../util/jsonbig.ts';

const isOnePropObj = (o: any, key: string) => o && typeof o === 'object' && Object.keys(o).length === 1 && Object.keys(o)[0] === key;

const isEmptyObj = (o: any) => {
  if (o && typeof o === 'object' && Object.keys(o).length === 0) {
    return true;
  }
  // noinspection RedundantIfStatementJS
  if (o && typeof o === 'object' && Object.values(o).every(v => v === 0 || isUnset(v) || isEmptyObj(v))) {
    return true;
  }
  return false;
}

// Some text map keys are strings instead of numbers, which are then converted to numbers for the final TextMap
// Use this function to get the numeric text map hash from the string key.
// noinspection JSUnusedLocalSymbols
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

function normalizeRecordForGenshin<T>(record: T): T {
  if (!record || typeof record !== 'object') {
    return record;
  }
  for (let key of Object.keys(record)) {
    let value = record[key];

    if (Array.isArray(value) && value.length) {
      value = value.filter(v => !isEmptyObj(v) && !isUnset(v) && v !== '').map(v => {
        return normalizeRecordForGenshin(v);
      });
      record[key] = value;
    } else if (value && typeof value === 'object') {
      record[key] = normalizeRecordForGenshin(value)
    }
  }
  return record;
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
    try {
      let fileData = await fsp.readFile(filePath, 'utf8');
      let json = parseJsonConvertingBigIntsToStrings(fileData);

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
      if (game === 'genshin') {
        if (Array.isArray(json)) {
          json.forEach(row => normalizeRecordForGenshin(row));
        } else {
          json = Object.values(json).map(row => normalizeRecordForGenshin(row));
        }
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
    } catch (e) {
      console.log(chalk.red(' (read error)'));
    }
  }

  console.log(chalk.blue(`Done, modified ${numChanged} files.`));
}

