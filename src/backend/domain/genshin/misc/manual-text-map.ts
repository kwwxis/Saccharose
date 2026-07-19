import { GenshinControl } from '../genshinControl.ts';
import { ManualTextMapConfigData } from '../../../../shared/types/genshin/dialogue-types.ts';
import { mapBy } from '../../../../shared/util/arrayUtil.ts';
import { createLangCodeMapOfSameValue, LangCode, LangCodeMap } from '../../../../shared/types/lang-types.ts';
import { isInt } from '../../../../shared/util/numberUtil.ts';
import { isString } from '../../../../shared/util/stringUtil.ts';
import { GCGTagElementType, GCGTagWeaponType } from '../../../../shared/types/genshin/gcg-types.ts';
import {
  WeaponExcelConfigData,
  WeaponLoadConf,
  WeaponType,
  WeaponTypeEN,
} from '../../../../shared/types/genshin/weapon-types.ts';

export class GenshinManualTextMap {
  constructor(readonly ctrl: GenshinControl) {
  }

  isKey(key: string): key is CustomTextMapKey {
    return key in ManualTextMapCustomKeys;
  }

  async getTextByKey(langCode: LangCode, key: CustomTextMapKey): Promise<string> {
    return this.ctrl.cached('CustomTextMapResolves:' + langCode + ':' + key, 'memory', async () => {
      const mappedKey = ManualTextMapCustomKeys[key];
      if (isInt(mappedKey)) {
        return await this.ctrl.getTextMapItem(langCode, mappedKey);
      } else if (isString(mappedKey)) {
        const record = await this.selectRecord(mappedKey);
        return record.TextMapContentText;
      } else {
        return null;
      }
    });
  }

  async mapByKey(key: CustomTextMapKey, doNormText: boolean = true): Promise<LangCodeMap> {
    return this.ctrl.cached('CustomTextMapResolves:LangCodeMap:' + key, 'memory', async () => {
      const mappedKey = ManualTextMapCustomKeys[key];
      if (isInt(mappedKey)) {
        return await this.ctrl.createLangCodeMap(mappedKey, doNormText);
      } else if (isString(mappedKey)) {
        const record = await this.selectRecord(mappedKey);
        return await this.ctrl.createLangCodeMap(record.TextMapContentTextMapHash, doNormText);
      } else {
        return createLangCodeMapOfSameValue(null);
      }
    });
  }

  async selectRecord(id: string): Promise<ManualTextMapConfigData> {
    return await this.ctrl.knex.select('*').from('ManualTextMapConfigData')
      .where({TextMapId: id}).first().then(this.ctrl.commonLoadFirst);
  }

  async selectMultiRecord(ids: string[]): Promise<Record<string, ManualTextMapConfigData>> {
    const result: ManualTextMapConfigData[] = await this.ctrl.knex.select('*').from('ManualTextMapConfigData')
      .whereIn('TextMapId', ids).then(this.ctrl.commonLoad);
    return mapBy(result, 'TextMapId');
  }

  async getElementName(langCode: LangCode, elementType: ElementType|GCGTagElementType): Promise<string> {
    return this.isKey(elementType)
      ? await this.getTextByKey(langCode, elementType)
      : await this.getTextByKey(langCode, 'None');
  }

  async getWeaponTypeName(langCode: LangCode, weaponType: WeaponType|WeaponTypeEN|GCGTagWeaponType): Promise<string> {
    return this.isKey(weaponType)
      ? await this.getTextByKey(langCode, weaponType)
      : await this.getTextByKey(langCode, 'None');
  }
}

export type CustomTextMapKey = keyof typeof ManualTextMapCustomKeys;

export const ManualTextMapCustomKeys = {
  // None:
  'None': 'None',
  'GCG_TAG_WEAPON_NONE': 'None',
  'GCG_TAG_ELEMENT_NONE': 'None',

  // All:
  'All': 'FURNITURE_SCREEN_ALL',
  'Other': 'UI_REPORT_CASE_OTHER',

  // Lumine/Aether:
  'Lumine': 'INFO_FEMALE_PRONOUN_YING',
  'Aether': 'INFO_MALE_PRONOUN_KONG',

  'ServerBrandTipsOverseas': 'Server_BrandTips_Oversea',
  'ServerEmailAskOverseas': 'Server_Email_Ask_Oversea',

  // Regions / Maps / Nations / Factions
  // --------------------------------------------------------------------------------------------------------------
  // Monstadt
  'Mondstadt': 'Mondstadt',
  'GCG_TAG_NATION_MONDSTADT': 'Mondstadt',

  // Liyue:
  'Liyue': 'Liyue',
  'GCG_TAG_NATION_LIYUE': 'Liyue',

  // Inazuma
  'Inazuma': 'Inazuma',
  'GCG_TAG_NATION_INAZUMA': 'Inazuma',

  // Sumeru
  'Sumeru': 'Sumeru',
  'GCG_TAG_NATION_SUMERU': 'Sumeru',

  // Fontaine
  'Fontaine': 'Fontaine',
  'GCG_TAG_NATION_FONTAINE': 'Fontaine',

  // Natlan
  'Natlan': 'Natlan',
  'GCG_TAG_NATION_NATLAN': 'Natlan',

  // Nod-Krai
  'Nod-Krai': 2879894,
  'GCG_TAG_NATION_NODKRAI': 3969490099,

  // Snezhnaya
  'Snezhnaya': 'Snezhnaya',
  'GCG_TAG_NATION_SNEZHNAYA': 'Snezhnaya',

  // Khaenri'ah
  "Khaenri'ah": 4075666795,
  'Khaenriah': 4075666795,
  'GCG_TAG_NATION_KHAENRIAH': 4075666795,

  // Simulanka:
  'Simulanka': 377968915,
  'GCG_TAG_NATION_SIMULANKA': 377968915,

  // Cosmic Calamity
  'Cosmic Calamity': 1897389369,
  'GCG_TAG_NATION_COSMIC_CALAMITY': 2708658179,

  // Other Maps
  'Serenitea Pot': 'UI_HOMEWORLD_OVERALL_DEC_TITLE',
  'Golden Apple Archipelago': 209420713,
  'Miliastra Wonderland': 'UI_BEYOND_ENTRANCE_BEYOND_TITLE',
  'Three Realms Gateway Offering': 2032300089,
  'Spiral Abyss': 'UI_TOWER_NAME',
  'Enkanomiya': 'UI_MAP_City3_TITLE_200',
  'Veluriyam Mirage': 84854953,
  'The Chasm: Underground Mines': 'UI_MAP_City2_TITLE_300',
  'Sea of Bygone Eras': 'UI_MAP_City5_TITLE_600',
  'Theater Lobby': 'UI_ROLE_COMBAT_RADAR_RESTROOM',
  'Ancient Sacred Mountain': 'UI_MAP_City6_TITLE_800',
  'Chenyu Vale': 68445495,

  // Other Factions
  'Fatui': 2363243827,
  'GCG_TAG_CAMP_FATUI': 2363243827,

  'Hilichurl': 148952339,
  'GCG_TAG_CAMP_HILICHURL': 148952339,

  'Monster': 880768379,
  'GCG_TAG_CAMP_MONSTER': 880768379,

  'Kairagi': 2722933019,
  'GCG_TAG_CAMP_KAIRAGI': 2722933019,

  'The Eremites': 2263672043,
  'GCG_TAG_CAMP_EREMITE': 2263672043,

  'Consecrated Beast': 1265668603,
  'GCG_TAG_CAMP_SACREAD': 1265668603,

  // General
  // --------------------------------------------------------------------------------------------------------------
  'Domains': 'UI_WORLD_DUNGEON_TIPS_TITLE',
  'Domain': 'DUNGEON_DAILY_FIGHT',

  'Furnishing Set': 1999112283,
  'Gift Set': 205103331,

  'Genius Invokation TCG': 'UI_GCG_CONNECT_FULL_TITLE',
  'Imaginarium Theater': 'UI_ROLE_COMBAT_NAME',
  'Stygian Onslaught': 'UI_ACTIVITY_LEYLINEC_MARK_TITLE',

  'EQUIP_BRACER': 'EQUIP_BRACER',
  'EQUIP_DRESS': 'EQUIP_DRESS',
  'EQUIP_NECKLACE': 'EQUIP_NECKLACE',
  'EQUIP_RING': 'EQUIP_RING',
  'EQUIP_SHOES': 'EQUIP_SHOES',

  // Elements
  // --------------------------------------------------------------------------------------------------------------
  // Pyro
  'Pyro': 'Fire',
  'Fire': 'Fire',
  'GCG_TAG_ELEMENT_HYDRO': 'Fire',

  // Hydro
  'Hydro': 'Water',
  'Water': 'Water',
  'GCG_TAG_ELEMENT_PYRO': 'Water',

  // Dendro
  'Dendro': 'Grass',
  'Grass': 'Grass',
  'GCG_TAG_ELEMENT_DENDRO': 'Grass',

  // Electro
  'Electro': 'Electric',
  'Electric': 'Electric',
  'Elec': 'Electric',
  'GCG_TAG_ELEMENT_ELECTRO': 'Electric',

  // Anemo
  'Anemo': 'Wind',
  'Wind': 'Wind',
  'GCG_TAG_ELEMENT_ANEMO': 'Wind',

  // Cryo
  'Cryo': 'Ice',
  'Ice': 'Ice',
  'GCG_TAG_ELEMENT_CRYO': 'Ice',

  // Geo
  'Geo': 'Rock',
  'Rock': 'Rock',
  'GCG_TAG_ELEMENT_GEO': 'Rock',

  // Physical
  'Physical': 2185633152,
  'Physic': 2185633152,

  // Weapons
  // --------------------------------------------------------------------------------------------------------------
  'Sword': 'WEAPON_SWORD_ONE_HAND',
  'WEAPON_SWORD_ONE_HAND': 'WEAPON_SWORD_ONE_HAND',
  'GCG_TAG_WEAPON_SWORD': 'WEAPON_SWORD_ONE_HAND',

  'Claymore': 'WEAPON_CLAYMORE',
  'WEAPON_CLAYMORE': 'WEAPON_CLAYMORE',
  'GCG_TAG_WEAPON_CLAYMORE': 'WEAPON_CLAYMORE',

  'Polearm': 'WEAPON_POLE',
  'WEAPON_POLE': 'WEAPON_POLE',
  'GCG_TAG_WEAPON_POLE': 'WEAPON_POLE',

  'Catalyst': 'WEAPON_CATALYST',
  'WEAPON_CATALYST': 'WEAPON_CATALYST',
  'GCG_TAG_WEAPON_CATALYST': 'WEAPON_CATALYST',

  'Bow': 'WEAPON_BOW',
  'WEAPON_BOW': 'WEAPON_BOW',
  'GCG_TAG_WEAPON_BOW': 'WEAPON_BOW',
};

export type ElementType = 'Electric' | 'Fire' | 'Grass' | 'Ice' | 'None' | 'Rock' | 'Water' | 'Wind';
export const ElementTypeArray: ElementType[] = [ 'Electric', 'Fire', 'Grass', 'Ice', 'None', 'Rock', 'Water', 'Wind' ];

export function standardElementCode(input: string): string {
  if (!input) {
    return null;
  }
  let out = STANDARD_ELEMENT_MAP[input.toLowerCase()];
  if (out) {
    return out;
  }
  const words = input.toLowerCase().split(/[\s_]+/g);
  for (let [key, value] of Object.entries(STANDARD_ELEMENT_MAP)) {
    if (words.includes(key)) {
      return value;
    }
  }
  return null;
}

const STANDARD_ELEMENT_MAP = {
  'pyro': 'PYRO',
  'fire': 'PYRO',

  'hydro': 'HYDRO',
  'water': 'HYDRO',

  'dendro': 'DENDRO',
  'grass': 'DENDRO',

  'electro': 'ELECTRO',
  'electric': 'ELECTRO',
  'elec': 'ELECTRO',

  'anemo': 'ANEMO',
  'wind': 'ANEMO',

  'cryo': 'CRYO',
  'ice': 'CRYO',

  'geo': 'GEO',
  'rock': 'GEO',

  'physical': 'PHYSICAL',
  'physic': 'PHYSICAL',
}
