import { LangCodeMap } from '../lang-types';

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
  'SITUATION_TYPE_COMMON_TRANSPORT' |
  'SITUATION_TYPE_ENTER_DAILY_DUNGEON' |
  'SITUATION_TYPE_ENTER_GCG_AI' |
  'SITUATION_TYPE_ENTER_GCG_CATPUB' |
  'SITUATION_TYPE_ENTER_GCG_FESTIVAL' |
  'SITUATION_TYPE_ENTER_GCG_NORMAL' |
  'SITUATION_TYPE_ENTER_GCG_PVE' |
  'SITUATION_TYPE_ENTER_GCG_PVP' |
  'SITUATION_TYPE_ENTER_HOMEWORLD' |
  'SITUATION_TYPE_ENTER_ISLAND' |
  'SITUATION_TYPE_ENTER_QUEST_DUNGEON' |
  'SITUATION_TYPE_ENTER_ROOM' |
  'SITUATION_TYPE_ENTER_TOWER' |
  'SITUATION_TYPE_LOGIN' |
  'SITUATION_TYPE_LOGOUT' |
  'SITUATION_TYPE_REVIVE';
export type LoadingTerrainType = 'LOADING_AREA_CITY' | 'LOADING_AREA_OUTDOOR';

export type LoadingPicPath =
  'UI_LoadingPic_Deshret' |
  'UI_LoadingPic_Dragonspine' |
  'UI_LoadingPic_Dungeon' |
  'UI_LoadingPic_Enkanomiya' |
  'UI_LoadingPic_GoldenAppleIsles' |
  'UI_LoadingPic_Homeworld' |
  'UI_LoadingPic_Inazuma' |
  'UI_LoadingPic_LiYue' |
  'UI_LoadingPic_MengDe' |
  'UI_LoadingPic_MichiaeMatsuri' |
  'UI_LoadingPic_Sumeru' |
  'UI_LoadingPic_TheChasm';

export interface LoadingSituationExcelConfigData {
  StageId: number,
  Area1Id: number[],

  AreaTerrainType: LoadingTerrainType,
  LoadingSituationType: LoadingSituationType,

  SceneId: number[],
  PicPath: LoadingPicPath,
}

export interface LoadingCat {
  catName: string,
  catNameMap: LangCodeMap,
  subCats: LoadingCat[],
  tips: LoadingTipsExcelConfigData[]
}
