import '../../loadenv.ts';
import fs, {promises as fsp} from 'fs';
import { defaultMap, isUnset } from '../../../shared/util/genericUtil.ts';
import { pathToFileURL } from 'url';
import JSONBigImport, { JSONBigInt } from '../../util/json-bigint';
import { PathAndValue, walkObject, WalkObjectProcessor } from '../../../shared/util/arrayUtil.ts';
import { isInt, isNumeric } from '../../../shared/util/numberUtil.ts';
import { isStringBlank } from '../../../shared/util/stringUtil.ts';
import path from 'node:path';

const JSONbig: JSONBigInt = JSONBigImport({ useNativeBigInt: true, objectProto: true });

const textMapHashes: Set<string> = new Set(Object.keys(
  JSON.parse(fs.readFileSync(path.resolve(process.env.GENSHIN_DATA_ROOT, './TextMap/TextMapEN.json'), 'utf-8'))
));

// region Types/Basic Utils
// --------------------------------------------------------------------------------------------------------------
const isEmptyObj = (o: any) => o && typeof o === 'object' && Object.keys(o).length === 0;

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

function shouldIgnore(field: PathAndValue): boolean {
  let val = field.value;
  if (isUnset(val))
    return true;
  if (typeof val === 'bigint')
    val = val.toString();
  if (isInt(val) && String(val).length >= 18)
    return true;
  if (isNumeric(val) && String(val).includes('.') && String(val).length >= 10)
    return true;
  if (typeof val === 'string' && isStringBlank(val))
    return true;
  if (Array.isArray(val) && !val.length)
    return true;
  if (isEmptyObj(val))
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
function areLikelySameRecord(record1: any, record2: any): boolean {
  let values1: Set<string> = new Set();
  let values2: Set<string> = new Set();

  let tmValues1: Set<string> = new Set();
  let tmValues2: Set<string> = new Set();

  function pathAdder(set: Set<string>, tmSet: Set<string>): WalkObjectProcessor {
    return field => {
      if (typeof field.value === 'bigint')
        field.value = field.value.toString();
      if (shouldIgnore(field))
        return;
      if (isPrimitiveArray(field.value)) {
        set.add(String(filterArray(field.value)));
        return 'NO-DESCEND';
      } else if (field.isLeaf) {
        set.add(String(field.value));
        if (textMapHashes.has(String(field.value))) {
          tmSet.add(String(field.value));
        }
      }
    };
  }

  walkObject(record1, pathAdder(values1, tmValues1));
  walkObject(record2, pathAdder(values2, tmValues2));

  const intersect = values1.intersection(values2);
  const maxValueCount = new Set([... values1, ... values2]).size;
  const intersectCount = intersect.size;

  const tmIntersect = tmValues1.intersection(tmValues2);
  const tmMaxValueCount = new Set([... tmValues1, ... tmValues2]).size;
  const tmIntersectCount = tmIntersect.size;

  let score: number;
  if (tmMaxValueCount > 0) {
    score = (
      ((intersectCount / maxValueCount) + (tmIntersectCount / tmMaxValueCount)) / 2
    );
  } else {
    score = (
      (intersectCount / maxValueCount)
    );
  }
  return score >= 0.7;
}

type RecordPair = {
  schemaRecord: any,
  obfRecord: any,
  schemaIndex: number,
  obfIndex: number
};

function pairRecords(schemaRecords: any[], obfRecords: any[]): RecordPair[] {
  let pairs: RecordPair[] = [];
  let schemaPassed: Set<number> = new Set();
  for (let i = 0; i < obfRecords.length; i++) {
    const obfRecord = obfRecords[i];
    for (let j = 0; j < schemaRecords.length; j++) {
      if (schemaPassed.has(j))
        continue;
      const schemaRecord = schemaRecords[j];
      if (areLikelySameRecord(schemaRecord, obfRecord)) {
        schemaPassed.add(j);
        pairs.push({obfIndex: i, obfRecord, schemaIndex: j, schemaRecord});
        break;
      }
    }
  }
  return pairs;
}
// endregion

// region Main Method
// --------------------------------------------------------------------------------------------------------------
async function main(schemaRecords: any[], obfRecords: any[]): Promise<{[obfProp: string]: string}> {
  let pairs: RecordPair[] = pairRecords(schemaRecords, obfRecords);

  const confidence: {[obfKey: string]: {[schemaKey: string]: number}} = defaultMap(() => defaultMap('Zero'));

  for (let pair of pairs) {
    const kvObf = unpackRecord(pair.obfRecord);
    const kvSchema = unpackRecord(pair.schemaRecord);

    kvObf.list.forEach(o => confidence[o.key]);

    // inspect({ kvObf, kvSchema})
    for (let sp of kvSchema.list) {
      const obfStructCandidates: KvPair[] = kvObf.forStructure(sp);
      for (let obfCand of obfStructCandidates) {
        if (String(obfCand.value) === String(sp.value)) {
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

  return result;
}
// endregion

// region CLI/Entrypoint
// --------------------------------------------------------------------------------------------------------------
export async function createPropertySchema(schemaFilePath: string,
                                           obfFilePath: string): Promise<{[obfProp: string]: string}> {
  const schemaFile: any[] = await fsp.readFile(schemaFilePath, {encoding: 'utf8'})
    .then(data => Object.freeze(JSONbig.parse(data)));
  const objFile: any[] = await fsp.readFile(obfFilePath, {encoding: 'utf8'})
    .then(data => JSONbig.parse(data));
  return await main(schemaFile.slice(0, 200), objFile.slice(0, 200));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const schema = await createPropertySchema(
      'C:\\Shared\\git\\GenshinArchive\\5.4\\ExcelBinOutput\\AchievementExcelConfigData.json',
      'C:\\Shared\\git\\GenshinData\\ExcelBinOutput\\AchievementExcelConfigData.json'
    );
    console.log(schema);
  })();
}

// endregion
