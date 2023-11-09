import { ItemRelationMap } from './material-types';
import { ReadableView } from './readable-types';

export type WeaponType = 'WEAPON_BOW' | 'WEAPON_CATALYST' | 'WEAPON_CLAYMORE' | 'WEAPON_POLE' | 'WEAPON_SWORD_ONE_HAND';
export type WeaponTypeEN = 'Bow' | 'Catalyst' | 'Claymore' | 'Polearm' | 'Sword';

export type WeaponLoadConf = { LoadRelations?: boolean, LoadReadable?: boolean, LoadEquipAffix?: boolean };

export interface WeaponExcelConfigData {
  WeaponType: WeaponType,
  RankLevel: number,
  WeaponBaseExp: number,
  SkillAffix: number[],
  EquipAffixList: EquipAffixExcelConfigData[],
  WeaponProp: object[],
  AwakenTexture: string,
  AwakenLightMapTexture: string,
  AwakenIcon: string,
  WeaponPromoteId: number,
  StoryId: number,
  Story?: ReadableView,
  GachaCardNameHash: string,
  DestroyRule?: 'DESTROY_RETURN_MATERIAL',
  DestroyReturnMaterial: number[],
  DestroyReturnMaterialCount: number[],
  Id: number,
  NameText: string,
  DescText: string,
  NameTextMapHash: number,
  DescTextMapHash: number,
  Icon: string,
  ItemType: 'ITEM_WEAPON',
  Weight: number,
  Rank: number,
  GadgetId: number,
  AwakenCosts: number[],
  InitialLockState: number,
  AwakenMaterial: number,
  EnhanceRule: number,
  UnRotate: boolean,
  Relations?: ItemRelationMap,
}

export interface WeaponCodexExcelConfigData {
  Id: number,
  WeaponId: number,
  SortOrder: number,
}

export interface EquipAffixExcelConfigData {
  Id: number,
  AffixId: number,
  AddProps: { PropType: EquipAffixPropType, Value: number }[],
  DescText: string,
  DescTextMapHash: number,
  Level: number,
  NameText: string,
  NameTextMapHash: number,
  OpenConfig?: string,
  ParamList: number[],
}

export type EquipAffixPropType =
  'FIGHT_PROP_ADD_HURT'|
  'FIGHT_PROP_ATTACK_PERCENT'|
  'FIGHT_PROP_CHARGE_EFFICIENCY'|
  'FIGHT_PROP_CRITICAL'|
  'FIGHT_PROP_CRITICAL_HURT'|
  'FIGHT_PROP_DEFENSE'|
  'FIGHT_PROP_DEFENSE_PERCENT'|
  'FIGHT_PROP_ELEC_ADD_HURT'|
  'FIGHT_PROP_ELEC_SUB_HURT'|
  'FIGHT_PROP_ELEMENT_MASTERY'|
  'FIGHT_PROP_FIRE_ADD_HURT'|
  'FIGHT_PROP_FIRE_SUB_HURT'|
  'FIGHT_PROP_GRASS_ADD_HURT'|
  'FIGHT_PROP_HEALED_ADD'|
  'FIGHT_PROP_HEAL_ADD'|
  'FIGHT_PROP_HP'|
  'FIGHT_PROP_HP_PERCENT'|
  'FIGHT_PROP_ICE_ADD_HURT'|
  'FIGHT_PROP_PHYSICAL_ADD_HURT'|
  'FIGHT_PROP_ROCK_ADD_HURT'|
  'FIGHT_PROP_SHIELD_COST_MINUS_RATIO'|
  'FIGHT_PROP_WATER_ADD_HURT';