import { LangCodeMap } from '../lang-types.ts';
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

export interface RewardData {
  Count1: number,
  Count2: number,
  Count3: number,
  Count4: number,
  Count5: number,
  Count6: number,
  Hcoin: number,
  IsSpecial: boolean,
  ItemId1: number,
  ItemId2: number,
  ItemId3: number,
  ItemId4: number,
  ItemId5: number,
  ItemId6: number,
  Level1: number,
  Level2: number,
  Level3: number,
  Level4: number,
  Level5: number,
  Level6: number,
  Rank1: number,
  Rank2: number,
  Rank3: number,
  Rank4: number,
  Rank5: number,
  Rank6: number,
  RewardId: number,
}
