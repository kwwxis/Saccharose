import { AvatarExcelConfigData, NpcExcelConfigData } from './general-types';

export interface HomeWorldEventExcelConfigData {
  EventId: number,
  EventType: 'HOME_AVATAR_SUMMON_EVENT' | 'HOME_AVATAR_REWARD_EVENT',
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  TalkId: number,
  RewardId: number,
  FurnitureSuitId: number,
  Order: number,
}

export interface HomeWorldNPCExcelConfigData {
  FurnitureId: number,
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  NpcId: number,
  Npc?: NpcExcelConfigData,
  TalkIds: number[],
  ShowNameTextMapHash: number,
  DescTextMapHash: number,
  RewardEvents: HomeWorldEventExcelConfigData[],
  SummonEvents: HomeWorldEventExcelConfigData[],
  IsNPC?: boolean,
}

export type FurnitureSurfaceType =
  'Animal' |
  'Apartment' |
  'Carpet' |
  'Ceil' |
  'Chandelier' |
  'Door' |
  'Floor' |
  'FurnitureSuite' |
  'LegoRockery' |
  'NPC' |
  'Road' |
  'StackObjPlane' |
  'Stair' |
  'Wall' |
  'WallBody';

export type SpecialFurnitureType =
  'Apartment' |
  'BlockDependent' |
  'ChangeBgmFurniture' |
  'CoopPictureFrame' |
  'CustomBaseFurnitrue' |
  'CustomNodeFurnitrue' |
  'FarmField' |
  'Fish' |
  'Fishpond' |
  'Fishtank' |
  'FurnitureSuite' |
  'GroupFurnitrue' |
  'NPC' |
  'Paimon' |
  'ServerGadget' |
  'TeleportPoint' |
  'VirtualFurnitrue';

export interface HomeWorldFurnitureExcelConfigData {
  Id: number,
  FurnitureGadgetId: number[],
  FurnType: number[],
  SurfaceType: FurnitureSurfaceType,
  GridStyle: number,
  Comfort: number,
  StackLimit: number,
  Cost: number,
  DiscountCost: number,
  Height: number,
  ItemIcon: string,
  ClampDistance: number,
  EditorClampDistance: number,
  RankLevel: number,
  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  DescText: string,
  Icon: string,
  ItemType: 'ITEM_FURNITURE', // always "ITEM_FURNITURE"
  Rank: number,
  SpecialFurnitureType: SpecialFurnitureType,
  IsUnique: number,
  IsSpecialFurniture: number,
  DeployGlitchIndex: number,
  IsCombinableLight: number,
  RoomSceneId: number,
  ArrangeLimit: number,
  EffectIcon: string,
  CanFloat: number,
  JsonName: string,
  PushTipsId: number,
  GroupRecordType?:
    'GROUP_RECORD_TYPE_BALLOON' |
    'GROUP_RECORD_TYPE_RACING' |
    'GROUP_RECORD_TYPE_SEEK' |
    'GROUP_RECORD_TYPE_STAKE',
}

export interface HomeWorldFurnitureTypeExcelConfigData {
  TypeId: number,
  TypeCategoryId: number,
  TypeNameTextMapHash: number,
  TypeName2TextMapHash: number,
  TypeNameText: string,
  TypeName2Text: string,
  TabIcon: string,
  IsShowInBag: boolean,
  SceneType?: 'Exterior' | undefined,
  BagPageOnly: number,
}

export interface FurnitureSuiteExcelConfigData {
  SuiteId: number,
  JsonName: string,
  SuiteNameTextMapHash: number,
  SuiteDescTextMapHash: number,
  SuiteNameText: string,
  SuiteDescText: string,
  FurnType: number[],
  ItemIcon: string,
  InterRatio: number,
  FavoriteNpcExcelIdVec: number[],
  TransStr: string,
  MapIcon: string,
}

export interface FurnitureMakeExcelConfigData {
  ConfigId: number,
  FurnitureItemId: number,
  Count: number,
  Exp: number,
  MaterialItems: {Id: number, Count: number}[],
  MakeTime: number,
  MaxAccelerateTime: number,
  QuickFetchMaterialNum: number,
}