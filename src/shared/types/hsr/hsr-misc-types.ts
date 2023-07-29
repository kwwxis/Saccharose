import { LangCodeMap } from '../lang-types';

export interface LoadingDesc {
  Id: number,

  TitleText: string,
  TitleTextMapHash: number,

  DescText: string,
  DescTextMapHash: number,

  ImagePath: number,
  MapEntranceId: number[],
  MaxLevel: number,
  MinLevel: number,
  MissionId: number,
  Weight: number,
}

export interface TextJoinConfig {
  TextJoinId: number,
  DefaultItem: number,
  TextJoinItemList: number[],
  TextJoinItemListMapped?: TextJoinItem[],
}

export interface TextJoinItem {
  TextJoinItemId: number,
  TextJoinTextMapHash: number
  TextJoinText: string,
  TextJoinTextMap: LangCodeMap,
}