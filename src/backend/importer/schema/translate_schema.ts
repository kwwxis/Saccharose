// noinspection RedundantIfStatementJS

import '../../loadenv.ts';
import fs, {promises as fsp} from 'fs';
import { defaultMap, isUnset } from '../../../shared/util/genericUtil.ts';
import { pathToFileURL } from 'url';
import {
  arraySum,
  PathAndValue,
  resolveObjectPath,
  walkObject,
  WalkObjectProcessor,
} from '../../../shared/util/arrayUtil.ts';
import { isInt, isNumeric } from '../../../shared/util/numberUtil.ts';
import path from 'node:path';
import { SchemaTableSet } from '../import_db.ts';
import { genshinSchema } from '../genshin/genshin.schema.ts';
import { JSONbig } from '../../util/jsonbig.ts';

const textMapHashes: Set<string> = new Set(Object.keys(
  JSON.parse(fs.readFileSync(path.resolve(ENV.GENSHIN_DATA_ROOT, './TextMap/TextMapEN.json'), 'utf-8'))
));

// region Types/Basic Utils
// --------------------------------------------------------------------------------------------------------------
const isEmptyObj = (o: any) => {
  if (o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length === 0) {
    return true;
  }
  if (o && typeof o === 'object' && Object.values(o).every(v => v === 0 || isUnset(v) || isEmptyObj(v))) {
    return true;
  }
  return false;
};

type ValueType = 'unset' | 'primitive' | 'record' | 'primitive[]' | 'record[]';

function isPrimitive(o: any): boolean {
  return !isUnset(o) && typeof o !== 'object';
}

function isPrimitiveArray(o: any): boolean {
  return Array.isArray(o) && o.every(x => isPrimitive(x) || isUnset(x));
}

function filterArray(a: any[]): any[] {
  return a.filter(v => !(
    isUnset(v) || (typeof v === 'string' && !v.length) || isEmptyObj(v)
  ));
}

function getValueType(o: any): ValueType {
  if (isUnset(o)) {
    return 'unset';
  } else if (typeof o === 'object') {
    if (Array.isArray(o)) {
      return o.every(x => isPrimitive(x) || isUnset(x)) ? 'primitive[]' : 'record[]';
    } else {
      return 'record';
    }
  } else {
    return 'primitive';
  }
}

export const shouldIgnoreConfig = {
  ignoreNullOrUndefined: true,
  ignoreIntsLargerThan17Digits: true,
  ignoreFloatsLargerThan9Digits: true,
  shouldIgnoreEmptyString: false
};

function shouldIgnore(field: PathAndValue): boolean {
  let val = field.value;

  if (isUnset(val)) {
    return shouldIgnoreConfig.ignoreNullOrUndefined;
  }

  if (typeof val === 'bigint')
    val = val.toString();

  if (shouldIgnoreConfig.ignoreIntsLargerThan17Digits && isInt(val) && String(val).length >= 18)
    return true;

  if (shouldIgnoreConfig.ignoreFloatsLargerThan9Digits && isNumeric(val) && String(val).includes('.') && String(val).length >= 10)
    return true;

  if (shouldIgnoreConfig.shouldIgnoreEmptyString && typeof val === 'string' && !val.length)
    return true;

  return false;
}
// endregion

// region Unpack/KV
// --------------------------------------------------------------------------------------------------------------
class KvPair {
  readonly valueType: ValueType;
  readonly valueTypeChain: ValueType[] = [];
  readonly dotPath: string;
  readonly level: number;
  readonly isTextMapValue: boolean;

  constructor(readonly path: string,
              readonly key: string,
              readonly value: any) {
    this.valueType = getValueType(value);
    this.dotPath = path.replace(/\.?\[([^\]]+)]/g, '.$1');
    this.level = this.dotPath.split(/\./g).length;
    this.isTextMapValue = textMapHashes.has(value);

    if (typeof value === 'bigint') {
      this.value = value.toString();
    }
    if (Array.isArray(value)) {
      this.value = filterArray(value);
    }
  }
}

function unpackRecord(record: any): UnpackResult {
  let result: KvPair[] = [];
  let pathToValueTypeMap: Record<string, ValueType> = {};

  walkObject(record, field => {
    if (shouldIgnore(field))
      return;
    let kvPair = new KvPair(
      field.path,
      field.basename,
      field.value,
    );
    pathToValueTypeMap[kvPair.dotPath] = kvPair.valueType;
    let dotPathParts = kvPair.dotPath.split(/\./g);
    do {
      kvPair.valueTypeChain.unshift(pathToValueTypeMap[dotPathParts.join('.')]);
      dotPathParts.pop();
    } while (dotPathParts.length);
    if (field.path.endsWith(']')) {
      return;
    }
    result.push(kvPair);
    if (isPrimitiveArray(field.value)) {
      return 'NO-DESCEND';
    }
  });
  return new UnpackResult(result);
}

class UnpackResult {
  constructor(readonly list: KvPair[]) {}
  forStructure(p: KvPair): KvPair[] {
    return this.list.filter(kv =>
      kv.level === p.level
      && kv.valueType === p.valueType
      && kv.valueTypeChain.join('.') === p.valueTypeChain.join('.')
      && kv.isTextMapValue === p.isTextMapValue);
  }
}
// endregion

// region Compare & Pair Records
// --------------------------------------------------------------------------------------------------------------
function areLikelySameRecord(appSchema: SchemaTableSet, schemaName: string, schemaRecord: any, obfRecord: any): boolean {
  // Scalar values:
  let scValues1: Set<string> = new Set();
  let scValues2: Set<string> = new Set();

  // Primitive-value vector values:
  let pvValues1: Set<string> = new Set();
  let pvValues2: Set<string> = new Set();

  // TextMap hash values:
  let tmValues1: Set<string> = new Set();
  let tmValues2: Set<string> = new Set();

  const pkField: string = appSchema?.[schemaName]?.columns?.find(c => c.isPrimary)?.name;

  function pathAdder(scSet: Set<string>, tmSet: Set<string>, pvSet: Set<string>): WalkObjectProcessor {
    return field => {
      if (typeof field.value === 'bigint')
        field.value = field.value.toString();
      if (shouldIgnore(field))
        return;
      if (isPrimitiveArray(field.value)) {
        let arr = filterArray(field.value);
        pvSet.add(String(arr));
        for (let item of arr) {
          scSet.add(String(item));
          if (textMapHashes.has(String(item))) {
            tmSet.add(String(item));
          }
        }
        return 'NO-DESCEND';
      } else if (field.isLeaf) {
        scSet.add(String(field.value));
        if (textMapHashes.has(String(field.value))) {
          tmSet.add(String(field.value));
        }
      }
    };
  }

  walkObject(schemaRecord, pathAdder(scValues1, tmValues1, pvValues1));
  walkObject(obfRecord, pathAdder(scValues2, tmValues2, pvValues2));

  const scIntersect = scValues1.intersection(scValues2);
  const scMaxValueCount = new Set([... scValues1, ... scValues2]).size;
  const scIntersectCount = scIntersect.size;

  const tmIntersect = tmValues1.intersection(tmValues2);
  const tmMaxValueCount = new Set([... tmValues1, ... tmValues2]).size;
  const tmIntersectCount = tmIntersect.size;

  const pvIntersect = pvValues1.intersection(pvValues2);
  const pvMaxValueCount = new Set([... pvValues1, ... pvValues2]).size;
  const pvIntersectCount = pvIntersect.size;

  let scScore = scMaxValueCount > 0 ? (scIntersectCount / scMaxValueCount) : 0;
  let tmScore = tmMaxValueCount > 0 ? (tmIntersectCount / tmMaxValueCount) : 0;
  let pvScore = pvMaxValueCount > 0 ? (pvIntersectCount / pvMaxValueCount) : 0;

  let scores: number[] = [scScore];

  if (tmScore > 0) {
    scores.push(tmScore);
  }
  if (pvScore > 0) {
    scores.push(pvScore);
  }

  let score: number = arraySum(scores) / scores.length;

  if (pkField) {
    const schemaPkVal = schemaRecord[pkField];
    if (isPrimitive(schemaPkVal) && !scValues2.has(String(schemaPkVal))) {
      score = 0;
    }
  }

  return score >= 0.7;
}

type RecordPair = {
  schemaRecord: any,
  obfRecord: any,
  schemaIndex: number,
  obfIndex: number
};

function pairRecords(appSchema: SchemaTableSet, schemaName: string, schemaRecords: any[], obfRecords: any[]): RecordPair[] {
  let pairs: RecordPair[] = [];
  let schemaPassed: Set<number> = new Set();
  for (let i = 0; i < obfRecords.length; i++) {
    const obfRecord = obfRecords[i];
    for (let j = 0; j < schemaRecords.length; j++) {
      if (schemaPassed.has(j))
        continue;
      const schemaRecord = schemaRecords[j];
      if (areLikelySameRecord(appSchema, schemaName, schemaRecord, obfRecord)) {
        schemaPassed.add(j);
        pairs.push({obfIndex: i, obfRecord, schemaIndex: j, schemaRecord});
        break;
      }
    }
  }
  return pairs;
}
// endregion

// region Post-Process
// --------------------------------------------------------------------------------------------------------------
export function createPropertySchemaPostProcess_imprintEmptyArrays(json: any[], arrayPaths: string[]) {
  if (!arrayPaths || !arrayPaths.length) {
    return;
  }
  json.forEach(row => {
    for (let arrayPath of arrayPaths) {
      if (!arrayPath.includes('[')) {
        const val = resolveObjectPath(row, arrayPath);
        if (isUnset(val)) {
          resolveObjectPath(row, arrayPath, 'set', []);
        }
      }
    }
  });
}
// endregion

// region Main Method
// --------------------------------------------------------------------------------------------------------------
export type PropertySchemaResult = {
  map: {[obfProp: string]: string},
  arrayPaths: string[],
}

async function main(appSchema: SchemaTableSet, schemaName: string, schemaRecords: any[], obfRecords: any[], visitMaxPairs: number = 0, maxRecordsSlice: number = 0): Promise<PropertySchemaResult> {
  if (isUnset(maxRecordsSlice)) {
    maxRecordsSlice = 0;
  }
  if (maxRecordsSlice && maxRecordsSlice > 0) {
    schemaRecords = schemaRecords.slice(0, maxRecordsSlice);
    obfRecords = obfRecords.slice(0, maxRecordsSlice);
  }

  let pairs: RecordPair[] = pairRecords(appSchema, schemaName, schemaRecords, obfRecords);

  if (isUnset(visitMaxPairs)) {
    visitMaxPairs = 0;
  }
  if (visitMaxPairs && visitMaxPairs > 0) {
    pairs = pairs.slice(0, visitMaxPairs);
  }

  const confidence: {[obfKey: string]: {[schemaKey: string]: number}} = defaultMap(() => defaultMap('Zero'));
  const arrayPaths: Set<string> = new Set();

  for (let pair of pairs) {
    const kvObf = unpackRecord(pair.obfRecord);
    const kvSchema = unpackRecord(pair.schemaRecord);

    kvObf.list.forEach(o => confidence[o.key]);

    // inspect({ kvObf, kvSchema})
    for (let sp of kvSchema.list) {
      if (sp.valueType === 'primitive[]' || sp.valueType === 'record[]') {
        arrayPaths.add(sp.path);
      }
      const obfStructCandidates: KvPair[] = kvObf.forStructure(sp);
      for (let obfCand of obfStructCandidates) {
        let str1 = String(obfCand.value);
        if (Array.isArray(obfCand.value))
          str1 = `[${str1}]`;

        let str2 = String(sp.value);
        if (Array.isArray(sp.value))
          str2 = `[${str2}]`;

        if (str1 === str2) {
          confidence[obfCand.key][sp.key]++;
        }
      }
    }
  }

  const result: {[obfProp: string]: string} = {};
  const chosenCandidates: Set<string> = new Set();

  function peerHasHigherScore(checkObfKey: string, checkCand: string, checkCandScore: number) {
    for (let [obfKey, x] of Object.entries(confidence)) {
      if (result[obfKey] || checkObfKey === obfKey)
        continue;
      for (let [cand, score] of Object.entries(x)) {
        if (chosenCandidates.has(cand) || cand !== checkCand)
          continue;
        if (score > checkCandScore)
          return true;
      }
    }
    return false;
  }

  while (true) {
    let numCandidatesChosen = 0;

    for (let [obfKey, candidates] of Object.entries(confidence)) {
      if (result[obfKey])
        continue;

      let bestCandidate: string = null;
      let bestScore: number = 0;
      for (let [schemaKey, score] of Object.entries(candidates)) {
        if (chosenCandidates.has(schemaKey)) {
          continue;
        }
        if (score > bestScore) {
          bestScore = score;
          bestCandidate = schemaKey;
        }
      }

      if (peerHasHigherScore(obfKey, bestCandidate, bestScore)) {
        // console.log('Candidate skipped: ' + bestCandidate + ' score ' + bestScore + ' for ' + obfKey);
        continue;
      }

      if (bestCandidate) {
        // console.log('Candidate chosen: ' + bestCandidate + ' score ' + bestScore + ' for ' + obfKey);
        chosenCandidates.add(bestCandidate);
        result[obfKey] = bestCandidate;
        numCandidatesChosen++;
      }
    }

    if (numCandidatesChosen === 0) {
      break;
    }
  }

  let filteredResult = {};

  for (let [key, value] of Object.entries(result)) {
    if (isInt(key)) {
      continue;
    }
    filteredResult[key] = value;
  }

  return { map: filteredResult, arrayPaths: Array.from(arrayPaths) };
}
// endregion

// region CLI/Entrypoint
// --------------------------------------------------------------------------------------------------------------
export async function createPropertySchema(appSchema: SchemaTableSet,
                                           schemaName: string,
                                           schemaFilePath: string,
                                           obfFilePath: string,
                                           visitMaxPairs: number = 0,
                                           maxRecordsSlice: number = 0): Promise<PropertySchemaResult> {
  const schemaFile: any[] = await fsp.readFile(schemaFilePath, {encoding: 'utf8'})
    .then(data => Object.freeze(JSONbig.parse(data)));
  const objFile: any[] = await fsp.readFile(obfFilePath, {encoding: 'utf8'})
    .then(data => JSONbig.parse(data));
  return await main(appSchema, schemaName, schemaFile, objFile, visitMaxPairs, maxRecordsSlice);
}

export async function createPropertySchemaWithArray(appSchema: SchemaTableSet,
                                                    schemaName: string,
                                                    schemaFile: any[],
                                                    objFile: any[],
                                                    visitMaxPairs: number = 0,
                                                    maxRecordsSlice: number = 0): Promise<PropertySchemaResult> {
  return await main(appSchema, schemaName, schemaFile, objFile, visitMaxPairs, maxRecordsSlice);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    // const schema = await createPropertySchema(
    //   genshinSchema,
    //   'AchievementExcelConfigData',
    //   'C:\\Shared\\git\\GenshinArchive\\5.4\\ExcelBinOutput\\AchievementExcelConfigData.json',
    //   'C:\\Shared\\git\\GenshinData\\ExcelBinOutput\\AchievementExcelConfigData.json'
    // );

    const schema = await main(
      genshinSchema,
      'MaterialExcelConfigData',
      [
        {
          "Id": 101,
          "DungeonList": [
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "OCMLKJLCFGL": [
            {},
            {}
          ],
          "DungeonGroup": [],
          "JumpTargets": [],
          "JumpParams": [],
          "GHBELCFCGKJ": "",
          "JumpDescs": [
            2918309764,
            423177506,
            3061022809,
            3451159373,
            2170337291,
            1148011312,
            2426800604
          ],
          "TextList": [
            2818091247,
            3976609992,
            2226649981,
            3329051684,
            4183258881,
            437959184,
            844019074,
            3661367191
          ]
        }
      ],
      [
        {
          "BADAABDJION": "",
          "dungeonGroup": [],
          "dungeonList": [
            0,
            0,
            0,
            0,
            0,
            0
          ],
          "EMNJMGDHCGE": [
            2918309764,
            423177506,
            3061022809,
            3451159373,
            2170337291,
            1148011312,
            2426800604
          ],
          "id": 101,
          "INDBKCAGBNK": "UI_MATERIAL_NULL",
          "JFFFHJPFJNN": [
            {
              "EEMKEAHMPON": "JUMP_NONE",
              "OMOAFANFNGI": 0
            },
            {
              "EEMKEAHMPON": "JUMP_NONE",
              "OMOAFANFNGI": 0
            }
          ],
          "jumpTargets": [],
          "textList": [
            2818091247,
            3976609992,
            2226649981,
            3329051684,
            4183258881,
            437959184,
            844019074,
            3661367191
          ]
        },
      ]
    )
    console.log(schema);
  })();
}

// endregion
