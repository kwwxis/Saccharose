export type WeaponType = 'WEAPON_BOW' | 'WEAPON_CATALYST' | 'WEAPON_CLAYMORE' | 'WEAPON_POLE' | 'WEAPON_SWORD_ONE_HAND';

export interface WeaponExcelConfigData {
  WeaponType: WeaponType,
  RankLevel: number,
  WeaponBaseExp: number,
  SkillAffix: number[],
  WeaponProp: object[],
  AwakenTexture: string,
  AwakenLightMapTexture: string,
  AwakenIcon: string,
  WeaponPromoteId: number,
  StoryId: number,
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
}

export interface WeaponCodexExcelConfigData {
  Id: number,
  WeaponId: number,
  SortOrder: number,
}