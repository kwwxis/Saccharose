export interface ConfigCondition<T extends string = string> {
  Type?: T,
  Param?: (string|number)[]
  Count?: string,
  ParamStr?: string,
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