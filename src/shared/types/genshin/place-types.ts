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
