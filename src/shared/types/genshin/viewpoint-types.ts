import { WorldAreaConfigData } from './general-types';

export interface ViewCodexExcelConfigData {
  Id: number,
  GadgetId: number,
  SceneId: number,
  GroupId: number,
  ConfigId: number,
  NameTextMapHash: number,
  DescTextMapHash: number,
  Image: string,
  CityId: number,
  WorldAreaId: number,
  SortOrder: number,
  NameText: string,
  DescText: string,
  ShowOnlyUnlocked: boolean,

  CityNameText?: string,
  WorldArea?: WorldAreaConfigData,
  ParentWorldArea?: WorldAreaConfigData,
  Wikitext?: string,
  DownloadImage?: string,
}

export type ViewpointsByRegion = { [region: string]: ViewCodexExcelConfigData[] };