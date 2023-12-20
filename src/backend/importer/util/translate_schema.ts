import {promises as fsp} from 'fs';
import { ucFirst } from '../../../shared/util/stringUtil';
import { defaultMap } from '../../../shared/util/genericUtil';
import { pathToFileURL } from 'url';
import { isInt } from '../../../shared/util/numberUtil';

interface KvPair {
  key: string;
  value: any;
  valueHash: string;
}

interface Candidate {
  obfPropName: string;
  candidateKeys: {[key: string]: number};
}

export function normalizeRawJsonKey(key: string) {
  if (key.startsWith('_')) {
    key = key.slice(1);
  }
  key = ucFirst(key);
  if (!(key.length === 11 && /^[A-Z]+$/.test(key))) {
    key = key.replace(/ID/g, 'Id');
  }
  key = key.replace(/TextText/g, 'Text');
  key = key.replace(/_(\w)/g, (fm: string, g: string) => g.toUpperCase()); // snake to camel
  return key;
}

function unpackRecord(record: any, normalizeKey: boolean): KvPair[] {
  let result: KvPair[] = [];
  let queue: any[] = [record];

  while (queue.length) {
    let curr: any = queue.shift();

    if (typeof curr !== 'object') {
      continue;
    }

    for (let [key, value] of Object.entries(curr)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) && value.length > 0) {
          value.forEach(v => queue.push(v));
        } else if (Object.keys(value).length > 0) {
          queue.push(value);
        }
      }
      if (normalizeKey) {
        key = normalizeRawJsonKey(key);
      }
      if (isInt(key)) {
        continue;
      }
      result.push({ key, value, valueHash: createValueHash(key, value) });
    }
  }

  return result;
}

export async function translateSchema(prevFilePath: string, currFilePath: string): Promise<{[obfProp: string]: string}> {

  let prevFile: any[] = await fsp.readFile(prevFilePath, {encoding: 'utf8'})
    .then(data => Object.freeze(JSON.parse(data)));

  let currFile: any[] = await fsp.readFile(currFilePath, {encoding: 'utf8'})
    .then(data => JSON.parse(data));

  const schemaResult: {[obfProp: string]: string} = {};

  let prevPropsByKey: {[key: string]: KvPair[]} = defaultMap('Array');
  let prevPropsByValueHash: {[key: string]: KvPair[]} = defaultMap('Array');

  let currPropsByKey: {[key: string]: KvPair[]} = defaultMap('Array');
  let currPropsByValueHash: {[key: string]: KvPair[]} = defaultMap('Array');

  console.log('Unpacking records')
  for (let i = 0; i < Math.max(prevFile.length, 25); i++) {
    let prevRecord = prevFile[i];
    let agdRecord = currFile[i];

    if (!prevRecord || !agdRecord) {
      break;
    }

    for (let pair of unpackRecord(prevRecord, true)) {
      prevPropsByKey[pair.key].push(pair);
      prevPropsByValueHash[pair.valueHash].push(pair);
    }

    for (let pair of unpackRecord(agdRecord, true)) {
      currPropsByKey[pair.key].push(pair);
      currPropsByValueHash[pair.valueHash].push(pair);
    }
  }

  const obfPropNames = new Set(Object.keys(currPropsByKey).filter(key => key.toUpperCase() === key));
  const candidates: Candidate[] = [];

  console.log('Gathering candidates', obfPropNames);
  for (let obfPropName of obfPropNames) {
    let candidateKeys: {[key: string]: number} = defaultMap('Zero');

    let agdValueHashes: any[] = currPropsByKey[obfPropName].map(p => p.valueHash);

    for (let agdValueHash of agdValueHashes) {
      for (let candidateKey of prevPropsByValueHash[agdValueHash].map(p => p.key)) {
        candidateKeys[candidateKey]++;
      }
    }

    candidates.push({ obfPropName, candidateKeys });
  }

  console.log('Sorting candidates');
  candidates.sort((a,b) => combinedCandidateKeysLength(b) - combinedCandidateKeysLength(a));

  const eliminatedCandidateKeys: string[] = [];

  console.log('Evaluating candidates');
  for (let candidate of candidates) {
    for (let eliminatedCandidateKey of eliminatedCandidateKeys) {
      if (candidate.candidateKeys.hasOwnProperty(eliminatedCandidateKey)) {
        delete candidate.candidateKeys[eliminatedCandidateKey];
      }
    }

    if (!Object.keys(candidate.candidateKeys).length) {
      continue;
    }

    let sortedCandidateKeys = Object.entries(candidate.candidateKeys).sort((a,b) => b[1] - a[1]);

    const topCandidateKey = sortedCandidateKeys[0][0];
    if (topCandidateKey === 'Id' && currFile[0] && currFile[0].hasOwnProperty('id')) {
      continue;
    }
    schemaResult[candidate.obfPropName] = topCandidateKey;
    eliminatedCandidateKeys.push(topCandidateKey);
  }

  return schemaResult;
}

function combinedCandidateKeysLength(candidate: Candidate) {
  return Object.values(candidate.candidateKeys).reduce((a, b) => a + b, 0);
}

function createValueHash(key: string, v: any) {
  if (Array.isArray(v)) {
    return '[' + v.map(vv => createValueHash(null, vv)).join(',') + ']';
  } else if (typeof v === 'object') {
    return '{' + Object.entries(v).map(([vk, vv] )=> createValueHash(vk, vv)).join(',') + '}';
  } else {
    if (
      (
        (key && key.endsWith("Hash")) ||
        (key && key.toUpperCase() === key)
      )
      && isInt(v)
      && String(v).length > 10
    ) {
      //console.log('Hash?', key, String(v), BigInt(String(v)).toString(16));
      return BigInt(String(v)).toString(16).slice(0,14);
    } else if (
      (key && key.endsWith("Hash")) && typeof v === 'string' && !isInt(v)
    ) {
      return v.slice(0,14);
    }
    return String(v);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const schema = await translateSchema(
      'C:\\Shared\\GenshinData\\ExcelBinOutput\\MonsterExcelConfigData.json',
      'C:\\Shared\\git\\AnimeGameData\\ExcelBinOutput\\MonsterExcelConfigData.json'
    );

    console.log(schema);
  })();
}