import { ItemRelationMap } from './material-types.ts';
import { Readable } from './readable-types.ts';
import { EquipAffixExcelConfigData } from './general-types.ts';
import { ExcelChangeRef } from '../changelog-types.ts';

export type WeaponType = 'WEAPON_BOW' | 'WEAPON_CATALYST' | 'WEAPON_CLAYMORE' | 'WEAPON_POLE' | 'WEAPON_SWORD_ONE_HAND';
export type WeaponTypeEN = 'Bow' | 'Catalyst' | 'Claymore' | 'Polearm' | 'Sword';

export type WeaponLoadConf = {
  LoadRelations?: boolean,
  LoadReadable?: boolean,
  LoadEquipAffix?: boolean,
  LoadAddedAt?: boolean,
};

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
  Story?: Readable,
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
  ItemTypeName?: string,
  Weight: number,
  Rank: number,
  GadgetId: number,
  AwakenCosts: number[],
  InitialLockState: number,
  AwakenMaterial: number,
  EnhanceRule: number,
  UnRotate: boolean,
  Relations?: ItemRelationMap,
  AddedAt?: ExcelChangeRef,
}

export interface WeaponCodexExcelConfigData {
  Id: number,
  WeaponId: number,
  SortOrder: number,
}
