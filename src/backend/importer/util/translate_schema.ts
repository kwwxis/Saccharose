import '../../loadenv.ts';
import {promises as fsp} from 'fs';
import { isUnset } from '../../../shared/util/genericUtil.ts';
import { pathToFileURL } from 'url';
import JSONbigimport from 'json-bigint';
import { walkObject } from '../../../shared/util/arrayUtil.ts';

const JSONbig = JSONbigimport({ useNativeBigInt: true});

// Type
// --------------------------------------------------------------------------------------------------------------
const isEmptyObj = (o: any) => o && typeof o === 'object' && Object.keys(o).length === 0;

type ValueType = 'unset' | 'primitive' | 'record' | 'primitive[]' | 'record[]';

function isPrimitive(o: any): boolean {
  return !isUnset(o) && typeof o !== 'object';
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

// Unpack/KV
// --------------------------------------------------------------------------------------------------------------
class KvPair {
  readonly valueType: ValueType;
  readonly dotPath: string;
  readonly level: number;

  constructor(readonly path: string,
              readonly key: string,
              readonly value: any) {
    this.valueType = getValueType(value);
    this.dotPath = path.replace(/\.?\[([^\]]+)]/g, '.$1');
    this.level = this.dotPath.split(/\./g).length;

    if (typeof value === 'bigint') {
      this.value = value.toString();
    }
    if (Array.isArray(value)) {
      this.value = value.filter(v => !(
        isUnset(v) || (typeof v === 'string' && !v.length) || isEmptyObj(v)
      ));
    }
  }
}

function unpackRecord(record: any): UnpackResult {
  let result: KvPair[] = [];
  walkObject(record, field => {
    result.push(new KvPair(
      field.path,
      field.basename,
      field.value,
    ));
    if (Array.isArray(field.value) && field.value.every(x => isPrimitive(x) || isUnset(x))) {
      return 'NO-DESCEND';
    }
  });
  return new UnpackResult(result);
}

class UnpackResult {
  constructor(readonly list: KvPair[]) {}

  for(level: number, valueType: ValueType): KvPair[] {
    return this.list.filter(kv => kv.level === level && kv.valueType === valueType);
  }
}

// Process REcord
// --------------------------------------------------------------------------------------------------------------
function evaluateRecord(prevPeers: any[], currPeers: any[]): void {
  // let ctx = unpack


}

export async function translateSchema(prevFilePath: string, currFilePath: string): Promise<{[obfProp: string]: string}> {
  const prevFile: any[] = await fsp.readFile(prevFilePath, {encoding: 'utf8'})
    .then(data => Object.freeze(JSONbig.parse(data)));
  const currFile: any[] = await fsp.readFile(currFilePath, {encoding: 'utf8'})
    .then(data => JSONbig.parse(data));

  evaluateRecord(prevFile, currFile);

  console.log('Evaluating candidates');
  const schemaResult: {[obfProp: string]: string} = {};
  return schemaResult;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    // const schema = await translateSchema(
    //   'C:\\Shared\\GenshinData\\ExcelBinOutput\\MonsterExcelConfigData.json',
    //   'C:\\Shared\\git\\AnimeGameData\\ExcelBinOutput\\MonsterExcelConfigData.json'
    // );
    //
    // console.log(schema);

    inspect(unpackRecord({
      "bodyType": "BODY_GIRL",
      "scriptDataPathHash": 17851432353698654000,
      "iconName": "UI_AvatarIcon_Kate",
      "sideIconName": "UI_AvatarIcon_Side_Kate",
      "qualityType": "QUALITY_PURPLE",
      "chargeEfficiency": 1,
      "combatConfigHash": 4103218460519001000,
      "initialWeapon": 11101,
      "weaponType": "WEAPON_SWORD_ONE_HAND",
      "manekinPathHash": 4090361390804372500,
      "imageName": "AvatarImage_Forward_Kate",
      "gachaCardNameHash": 11812712877647516000,
      "gachaImageNameHash": 8639279672678167000,
      "coopPicNameHash": 6857551110703300000,
      "cutsceneShow": "",
      "skillDepotId": 101,
      "staminaRecoverSpeed": 25,
      "candSkillDepotIds": [],
      "manekinJsonConfigHash": 5815996370094428000,
      "manekinMotionConfig": 100,
      "descTextMapHash": 1731825193,
      "avatarIdentityType": "AVATAR_IDENTITY_NORMAL",
      "avatarPromoteId": 2,
      "avatarPromoteRewardLevelList": [ 1, 3, 5 ],
      "avatarPromoteRewardIdList": [ 900011, 900013, 900015 ],
      "featureTagGroupID": 10000001,
      "infoDescTextMapHash": 1731825193,
      "HOGEDCCNOJC": 17298811984805868000,
      "LIGCDNGHMNJ": 4103218460519001000,
      "hpBase": 166,
      "attackBase": 5,
      "defenseBase": 8,
      "critical": 0.05,
      "criticalHurt": 0.5,
      "propGrowCurves": [
        {
          "type": "FIGHT_PROP_BASE_HP",
          "growCurve": "GROW_CURVE_HP_S4"
        },
        {
          "type": "FIGHT_PROP_BASE_ATTACK",
          "growCurve": "GROW_CURVE_ATTACK_S4"
        },
        {
          "type": "FIGHT_PROP_BASE_DEFENSE",
          "growCurve": "GROW_CURVE_HP_S4"
        }
      ],
      "prefabPathRagdollHash": 16909531753469473000,
      "deformationMeshPathHash": 16843554909179270000,
      "id": 10000001,
      "nameTextMapHash": 1857915418,
      "prefabPathHash": 6345797410857021000,
      "prefabPathRemoteHash": 11423433385109518000,
      "controllerPathHash": 9975873023065426000,
      "controllerPathRemoteHash": 8121517168866487000,
      "lodPatternName": ""
    }).list);
  })();
}
