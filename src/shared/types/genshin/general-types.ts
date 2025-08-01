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
  BodyType: NpcExcelConfigDataBodyType,
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

  HasDialogs?: boolean,
  HasTalks?: boolean,
  HasTalksOrDialogs?: boolean,
}

export type NpcExcelConfigDataBodyType =
  'AVATAR_BOY'    |
  'AVATAR_GIRL'   |
  'AVATAR_LADY'   |
  'AVATAR_LOLI'   |
  'AVATAR_MALE'   |
  'AVATAR_PAIMON' |
  'Barbara'       |
  'Bennett'       |
  'Chongyun'      |
  'Collei'        |
  'Diona'         |
  'NONE'          |
  'NPC_CHILD'     |
  'NPC_ELDER'     |
  'NPC_FEMALE'    |
  'NPC_GIRL'      |
  'NPC_MALE'      |
  'NPC_MUSCLEMAN' |
  'NPC_Others'    |
  'Ningguang'     |
  'Noel'          ;


export type WorldAreaType = 'LEVEL_1' | 'LEVEL_2';

export interface WorldAreaConfigData {
  Id: number,
  SceneId: number,
  AreaId1: number,
  AreaId2: number,

  ElementType?: string,
  TerrainType?: 'AREA_TERRAIN_CITY' | 'AREA_TERRAIN_OUTDOOR',
  AreaType: WorldAreaType,

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

  // Custom:
  ParentCity?: CityConfigData,
}

export interface GenshinImage {
  originalName: string,
  downloadName: string,
}

export const formatTime = (time: number) => {
  let hour = Math.floor(time) + '';
  let minute = (time+'').includes('.') ? (time+'').split('.')[1] : '00';

  hour = hour.padStart(2, '0');
  minute = minute.padEnd(2, '0');
  return hour + ':' + minute;
};

export interface SpriteTagExcelConfigData {
  Id: number,
  Image: string,
}
