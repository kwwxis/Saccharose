export interface ConfigCondition<T extends string = string> {
  Type?: T,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
}

export interface CityConfigData {
  CityId: number,
  SceneId: number,
  AreaIdVec: number[],
  CityNameTextMapHash: number,
  MapPosX: number,
  MapPosY: number,
  ZoomForExploration: number,
  AdventurePointId: number,
  ExpeditionMap: string,
  ExpeditionWaterMark: string,
  OpenState: string,
  CityGoddnessNameTextMapHash: number,
  CityGoddnessDescTextMapHash: number,
  CityNameText: string,
  CityNameTextEN: string,
  CityGoddnessNameText: string,
  CityGoddnessDescText: string,
}

export interface NpcExcelConfigData {
  Id: number,
  NameTextMapHash: number,
  NameText: string,

  JsonName: string,
  SpecialType: string,
  BodyType: string,
  Alias: string,

  HasMove: boolean,
  HasAudio: boolean,
  IsDaily: boolean,
  Invisiable: boolean,
  DisableShowName: boolean,
  UseDynBone: boolean,
  SkipInitClosetToGround: boolean,
  IsActivityDailyNpc: boolean,

  BillboardType: string,
  BillboardIcon: string,

  CampId: number,
  FirstMetId: number,
  UniqueBodyId: number,

  ScriptDataPath: string,
  PrefabPathHash: string,
  TemplateEmotionPath: string,
  AnimatorConfigPathHash: string,
  JsonPathHash: string,
  LuaDataPath: string,
  LuaDataIndex: number,
  OKJNGNPPCBP: string,
  JMJLKENBJEA: number,
  BHDMIMPGPOI: number[],
}


export interface WorldAreaConfigData {
  Id: number,
  SceneId: number,
  AreaId1: number,
  AreaId2: number,

  ElementType?: string,
  TerrainType?: 'AREA_TERRAIN_CITY' | 'AREA_TERRAIN_OUTDOOR',
  AreaType: 'LEVEL_1' | 'LEVEL_2',

  AreaNameTextMapHash: number,
  AreaNameText: string,

  AreaDefaultLock: boolean,
  ShowTips: boolean,
  TowerPointId: number,
  AreaOffset: number[],
  MinimapScale: number,

  BIIDMOCNDEL: number[],
  HBLACDGEBND: number[],
  GJBLMBDABFF: boolean,
}

export type ElementType = 'Electric' | 'Fire' | 'Grass' | 'Ice' | 'None' | 'Rock' | 'Water' | 'Wind';
export const ElementTypeArray: ElementType[] = ['Electric', 'Fire', 'Grass', 'Ice', 'None', 'Rock', 'Water', 'Wind'];
export const ElementTypeToNameTextMapHash = {
  'None': 3053155130,
  'Fire': 3531671786,
  'Water': 514679490,
  'Grass': 3552853794,
  'Electric': 1844493602,
  'Wind': 594678994,
  'Ice': 3168728290,
  'Rock': 1844983962,
};
export const ElementTypeToNation = {
  'None': 'None',
  'Fire': 'Natlan',
  'Water': 'Fontaine',
  'Grass': 'Sumeru',
  'Electric': 'Inazuma',
  'Wind': 'Mondstadt',
  'Ice': 'Snezhnaya',
  'Rock': 'Liyue',
};

export interface LoadingTipsExcelConfigData {
  Id: number,

  // Text:
  TipsTitleText: string,
  TipsDescText: string,
  TipsTitleTextMapHash: number,
  TipsDescTextMapHash: number,

  // Conds:
  PreMainQuestIds: string,
  PreQuestIdList: number[],
  DisableQuestIdList: number[],
  EnableDungeonId: never,

  // Data:
  StageId: string,
  Weight: number,
  MinLevel: number,
  LimitOpenState: 'OPEN_STATE_COMBINE' | 'OPEN_STATE_GACHA' | 'OPEN_STATE_GUIDE_BLOSSOM' | 'OPEN_STATE_LOADINGTIPS_ENKANOMIYA',
}

export type LoadingSituationType =
  'SITUATION_TYPE_COMMON_TRANSPORT'   |
  'SITUATION_TYPE_ENTER_DAILY_DUNGEON'|
  'SITUATION_TYPE_ENTER_GCG_AI'       |
  'SITUATION_TYPE_ENTER_GCG_CATPUB'   |
  'SITUATION_TYPE_ENTER_GCG_FESTIVAL' |
  'SITUATION_TYPE_ENTER_GCG_NORMAL'   |
  'SITUATION_TYPE_ENTER_GCG_PVE'      |
  'SITUATION_TYPE_ENTER_GCG_PVP'      |
  'SITUATION_TYPE_ENTER_HOMEWORLD'    |
  'SITUATION_TYPE_ENTER_ISLAND'       |
  'SITUATION_TYPE_ENTER_QUEST_DUNGEON'|
  'SITUATION_TYPE_ENTER_ROOM'         |
  'SITUATION_TYPE_ENTER_TOWER'        |
  'SITUATION_TYPE_LOGIN'              |
  'SITUATION_TYPE_LOGOUT'             |
  'SITUATION_TYPE_REVIVE'             ;
export type LoadingTerrainType = 'LOADING_AREA_CITY' | 'LOADING_AREA_OUTDOOR';

export type LoadingPicPath =
  'UI_LoadingPic_Deshret'         |
  'UI_LoadingPic_Dragonspine'     |
  'UI_LoadingPic_Dungeon'         |
  'UI_LoadingPic_Enkanomiya'      |
  'UI_LoadingPic_GoldenAppleIsles'|
  'UI_LoadingPic_Homeworld'       |
  'UI_LoadingPic_Inazuma'         |
  'UI_LoadingPic_LiYue'           |
  'UI_LoadingPic_MengDe'          |
  'UI_LoadingPic_MichiaeMatsuri'  |
  'UI_LoadingPic_Sumeru'          |
  'UI_LoadingPic_TheChasm'        ;

export interface LoadingSituationExcelConfigData {
  StageId: number,
  Area1Id: number[],

  AreaTerrainType: LoadingTerrainType,
  LoadingSituationType: LoadingSituationType,

  SceneId: number[],
  PicPath: string,
}

export type LoadingTipsByCategory = {[category: string]: LoadingTipsExcelConfigData[]};