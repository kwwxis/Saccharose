export interface ConfigCondition<T extends string = string> {
  Type?: T,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
}

export interface GenshinImage {
  originalName: string,
  downloadName: string,
}

export interface SpriteTagExcelConfigData {
  Id: number,
  Image: string,
}

export interface HyperLinkNameExcelConifgData {
  Id: number,
  Color: string,

  NameText: string,
  NameTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,
  DescParamList: string[],
}

export interface FeatureTagExcelConfigData {
  TagId: number,
  FeatureTagEnum: string,
  GroupIds?: number[],
}

export interface FeatureTagGroupExcelConfigData {
  GroupId: number,
  TagIds: number[],
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
  'FIGHT_PROP_ADD_HURT' |
  'FIGHT_PROP_ATTACK_PERCENT' |
  'FIGHT_PROP_CHARGE_EFFICIENCY' |
  'FIGHT_PROP_CRITICAL' |
  'FIGHT_PROP_CRITICAL_HURT' |
  'FIGHT_PROP_DEFENSE' |
  'FIGHT_PROP_DEFENSE_PERCENT' |
  'FIGHT_PROP_ELEC_ADD_HURT' |
  'FIGHT_PROP_ELEC_SUB_HURT' |
  'FIGHT_PROP_ELEMENT_MASTERY' |
  'FIGHT_PROP_FIRE_ADD_HURT' |
  'FIGHT_PROP_FIRE_SUB_HURT' |
  'FIGHT_PROP_GRASS_ADD_HURT' |
  'FIGHT_PROP_HEALED_ADD' |
  'FIGHT_PROP_HEAL_ADD' |
  'FIGHT_PROP_HP' |
  'FIGHT_PROP_HP_PERCENT' |
  'FIGHT_PROP_ICE_ADD_HURT' |
  'FIGHT_PROP_PHYSICAL_ADD_HURT' |
  'FIGHT_PROP_ROCK_ADD_HURT' |
  'FIGHT_PROP_SHIELD_COST_MINUS_RATIO' |
  'FIGHT_PROP_WATER_ADD_HURT';
