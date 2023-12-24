import { HomeworldAnimalExcelConfigData } from './homeworld-types.ts';

// Monster
// --------------------------------------------------------------------------------------------------------------

export interface MonsterLoadConf {
  LoadHomeWorldAnimal?: boolean,
  LoadModelArtPath?: boolean,
}

export interface MonsterExcelConfigData {
  Id: number,
  MonsterName: string,
  NameText: string,
  NameTextMapHash: number,
  SecurityLevel?: 'BOSS' | 'ELITE',
  Type: 'MONSTER_BOSS' | 'MONSTER_ENV_ANIMAL' | 'MONSTER_FISH' | 'MONSTER_ORDINARY' | 'MONSTER_PARTNER',

  DescribeId: number,
  Describe?: CommonDescribe,
  MonsterDescribe?: MonsterDescribeExcelConfigData,
  AnimalDescribe?: AnimalDescribeExcelConfigData,
  AnimalCodex?: AnimalCodexExcelConfigData,
  HomeWorldAnimal?: HomeworldAnimalExcelConfigData,

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

  PrefabPathHash: string,
  PrefabPathRemoteHash: string,
  ControllerPathHash: string,
  ControllerPathRemoteHash: string,
  CampId: number,
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
  PrefabPathRagdollHash: string,
  OKJNGNPPCBP: string,
}

export interface CommonDescribe {
  Id: number,
  Icon: string,
  NameText: string,
  NameTextMapHash: number,
}

export interface MonsterDescribeExcelConfigData extends CommonDescribe {
  Id: number
  TitleId: number,
  Title: MonsterTitleExcelConfigData,
  SpecialNameLabId: number,
  SpecialNameLabList: MonsterSpecialNameExcelConfigData[],
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

// Archive
// --------------------------------------------------------------------------------------------------------------

export interface LivingBeingArchive {
  MonsterCodex: {[subType: string]: LivingBeingArchiveGroup},
  WildlifeCodex: {[subType: string]: LivingBeingArchiveGroup},
  NonCodexMonsters: {[subType: string]: LivingBeingArchiveGroup},
}

export interface LivingBeingArchiveGroup {
  SubType: string,
  NameText: string,
  CodexList: AnimalCodexExcelConfigData[],
  MonsterList?: MonsterExcelConfigData[],
}

// Tabs:
//   UI_CODEX_ANIMAL_MONSTER -> Enemies and Monsters
//   UI_CODEX_ANIMAL_ANIMAL  -> Wildlife

// Not unlocked
//   UI_CODEX_ANIMAL_MONSTER_NONE -> Unlock this archive entry by defeating the appropriate enemy
//   UI_CODEX_ANIMAL_ANIMAL_NONE  -> Unlock this archive entry by hunting or discovering the appropriate animal

// Categories
//   UI_CODEX_ANIMAL_CATEGORY_ABYSS       -> The Abyss
//   UI_CODEX_ANIMAL_CATEGORY_ANIMAL      -> Beasts
//   UI_CODEX_ANIMAL_CATEGORY_AUTOMATRON  -> Automatons
//   UI_CODEX_ANIMAL_CATEGORY_AVIARY      -> Birds
//   UI_CODEX_ANIMAL_CATEGORY_BEAST       -> Mystical Beasts
//   UI_CODEX_ANIMAL_CATEGORY_BOSS        -> Enemies of Note
//   UI_CODEX_ANIMAL_CATEGORY_CRITTER     -> Other
//   UI_CODEX_ANIMAL_CATEGORY_FATUI       -> Fatui
//   UI_CODEX_ANIMAL_CATEGORY_FISH        -> Fish
//   UI_CODEX_ANIMAL_CATEGORY_HILICHURL   -> Hilichurls
//   UI_CODEX_ANIMAL_CATEGORY_HUMAN       -> Other Human Factions

//   UI_CODEX_ANIMAL_CATEGORY_ELEMENTAL   -> Elemental Lifeforms
//   UI_CODEX_ANIMAL_NAME_LOCKED          -> ???

// Monster
// --------------------------------------------------------------------------------------------------------------

export type AnimalCodexType = 'CODEX_MONSTER' | 'CODEX_WILDLIFE';
export type AnimalCodexSubType =
  'CODEX_SUBTYPE_ABYSS'       |
  'CODEX_SUBTYPE_ANIMAL'      |
  'CODEX_SUBTYPE_AUTOMATRON'  |
  'CODEX_SUBTYPE_AVIARY'      |
  'CODEX_SUBTYPE_BEAST'       |
  'CODEX_SUBTYPE_BOSS'        |
  'CODEX_SUBTYPE_CRITTER'     |
  'CODEX_SUBTYPE_ELEMENTAL'   |
  'CODEX_SUBTYPE_FATUI'       |
  'CODEX_SUBTYPE_FISH'        |
  'CODEX_SUBTYPE_HILICHURL'   |
  'CODEX_SUBTYPE_HUMAN'       ;
export type AnimalCodexCountType = 'CODEX_COUNT_TYPE_CAPTURE' | 'CODEX_COUNT_TYPE_FISH' | 'CODEX_COUNT_TYPE_KILL';
export interface AnimalCodexExcelConfigData {
  Id: number,
  DescribeId: number,
  SortOrder: number,
  PushTipsCodexId: number,

  Type?: AnimalCodexType,
  SubType?: AnimalCodexSubType,
  CountType?: AnimalCodexCountType,

  DescText: string,
  DescTextMapHash: number,

  AltDescTextList: string[],
  AltDescTextMapHashList: number[],
  AltDescTextQuestCondIds: number[],
  AltDescTextQuestConds: {NameText: string, MainQuestId: number}[],

  IsDisuse: boolean,
  IsSeenActive: boolean,
  ModelPath: string,
  ModelArtPath: string,
  ShowOnlyUnlocked: boolean,

  // Custom
  TypeName?: string,
  SubTypeName?: string,
  Icon?: string,
  NameText?: string,
  NameTextMapHash?: number,
  AnimalDescribe?: AnimalDescribeExcelConfigData,
  MonsterDescribe?: MonsterDescribeExcelConfigData;
  Monsters?: MonsterExcelConfigData[],
}

export interface AnimalDescribeExcelConfigData extends CommonDescribe {
  Id: number,
  Icon: string,
  NameText: string,
  NameTextMapHash: number,
}
