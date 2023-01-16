
export interface MonsterExcelConfigData {
  Id: number,
  MonsterName: string,
  NameText: string,
  NameTextMapHash: number,
  Type: 'MONSTER_BOSS' | 'MONSTER_ENV_ANIMAL' | 'MONSTER_FISH' | 'MONSTER_ORDINARY' | 'MONSTER_PARTNER',
  ScriptDataPathHash: string,
  CombatConfigHash: string,
  Affix: undefined[],
  Ai: string,
  IsAIHashCheck: boolean,
  Equips: number[],
  HpDrops: {DropId: number, HpPercent: number}[],
  KillDropId: number,
  FeatureTagGroupId: number,
  MpPropId: number,
  Describe?: MonsterDescribeExcelConfigData,
  DescribeId: number,
  CombatBGMLevel: number,
  EntityBudgetLevel: number,
  HpBase: number,
  AttackBase: number,
  DefenseBase: number,
  Critical: number,
  AntiCritical: number,
  CriticalHurt: number,
  FireSubHurt: number,
  GrassSubHurt: number,
  WaterSubHurt: number,
  ElecSubHurt: number,
  WindSubHurt: number,
  IceSubHurt: number,
  RockSubHurt: number,
  FireAddHurt: number,
  GrassAddHurt: number,
  WaterAddHurt: number,
  ElecAddHurt: number,
  WindAddHurt: number,
  IceAddHurt: number,
  RockAddHurt: number,
  PropGrowCurves: {Type: string, GrowCurve: string}[],
  ElementMastery: number,
  PhysicalSubHurt: number,
  PhysicalAddHurt: number,
  PrefabPathRagdollHash: string,
  OKJNGNPPCBP: string,
  PrefabPathHash: string,
  PrefabPathRemoteHash: string,
  ControllerPathHash: string,
  ControllerPathRemoteHash: string,
  CampId: number,
  SecurityLevel?: 'BOSS' | 'ELITE',
  IsInvisibleReset: boolean,
  SafetyCheck: boolean,
  IsSceneReward: boolean,
  VisionLevel?: 'VISION_LEVEL_LITTLE_REMOTE' | 'VISION_LEVEL_NEARBY' | 'VISION_LEVEL_SUPER' | 'VISION_LEVEL_SUPER_NEARBY',
  LODPatternName: string,
  ServerScript: string,
  Skin: string,
  HideNameInElementView: boolean,
  ExcludeWeathers: string,
  RadarHintId: number,
}

export interface MonsterDescribeExcelConfigData {
  Id: number
  TitleId: number,
  Title: MonsterTitleExcelConfigData,
  SpecialNameLabId: number,
  SpecialName: MonsterSpecialNameExcelConfigData,
  Icon: string,
  NameText: string,
  NameTextMapHash: number,
}

export interface MonsterSpecialNameExcelConfigData {
  SpecialNameId: number,
  SpecialNameLabId: number,
  SpecialNameTextMapHash: number,
  SpecialNameText: string,
  IsInRandomList: boolean,
}
export interface MonsterTitleExcelConfigData {
  TitleId: number,
  TitleNameTextMapHash: number,
  IsInverted: boolean,
  TitleNameText: string,
}