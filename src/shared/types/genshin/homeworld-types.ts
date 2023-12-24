import { NpcExcelConfigData } from './general-types.ts';
import { AvatarExcelConfigData } from './avatar-types.ts';
import { MaterialExcelConfigData, MaterialVecItem, RewardExcelConfigData } from './material-types.ts';
import { MonsterExcelConfigData } from './monster-types.ts';
import { DialogueSectionResult } from '../../../backend/domain/genshin/dialogue/dialogue_util.ts';
// HomeWorld NPC/Avatar
// --------------------------------------------------------------------------------------------------------------
export interface HomeWorldEventExcelConfigData {
  EventId: number,
  EventType: 'HOME_AVATAR_SUMMON_EVENT' | 'HOME_AVATAR_REWARD_EVENT',
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,
  TalkId: number,
  RewardId: number,
  Reward?: RewardExcelConfigData,
  FurnitureSuitId: number,
  Order: number,
}

export interface HomeWorldNPCLoadConf {
  LoadHomeWorldEvents?: boolean,
}

export interface HomeWorldNPCExcelConfigData {
  CommonId?: number;
  CommonName?: string;
  CommonNameTextMapHash?: number;
  CommonIcon?: string;

  // Playable Characters:
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,

  // Only Paimon:
  NpcId: number,
  Npc?: NpcExcelConfigData,

  FurnitureId: number,
  //Furniture?: HomeWorldFurnitureExcelConfigData,
  TalkIds: number[],
  ShowNameTextMapHash: number,
  DescTextMapHash: number,
  RewardEvents: HomeWorldEventExcelConfigData[],
  SummonEvents: HomeWorldEventExcelConfigData[],
  IsNPC?: boolean,

  // These three icon properties only used for Paimon.
  // Player icons are via Avatar.IconName
  HeadIcon?: string,
  FrontIcon?: string,
  SideIcon?: string,
}

// Furniture Types
// --------------------------------------------------------------------------------------------------------------
export type FurnitureSurfaceType =
  'Animal'        |
  'Apartment'     |
  'Carpet'        |
  'Ceil'          |
  'Chandelier'    |
  'Door'          |
  'Floor'         |
  'FurnitureSuite'|
  'LegoRockery'   |
  'NPC'           |
  'Road'          |
  'StackObjPlane' |
  'Stair'         |
  'Wall'          |
  'WallBody'      ;

export type SpecialFurnitureType =
  'Apartment'             |
  'BlockDependent'        |
  'ChangeBgmFurniture'    |
  'CoopPictureFrame'      |
  'CustomBaseFurnitrue'   |
  'CustomNodeFurnitrue'   |
  'FarmField'             |
  'Fish'                  |
  'Fishpond'              |
  'Fishtank'              |
  'FurnitureSuite'        |
  'GroupFurnitrue'        |
  'NPC'                   |
  'Paimon'                |
  'ServerGadget'          |
  'TeleportPoint'         |
  'VirtualFurnitrue'      ;

// Furniture
// --------------------------------------------------------------------------------------------------------------
export interface HomeWorldFurnitureLoadConf {
  LoadHomeWorldNPC?: boolean,
  LoadHomeWorldAnimal?: boolean,
  LoadMakeData?: boolean,
  LoadRelatedMaterial?: boolean,
}

export interface HomeWorldFurnitureExcelConfigData {
  Id: number,

  // Name:
  NameTextMapHash: number,
  DescTextMapHash: number,
  NameText: string,
  DescText: string,

  // Icon:
  Icon: string,
  ItemIcon: string,
  EffectIcon?: 'UI_Buff_Furniture_MarkTransPoint',

  // Type Data:
  ItemType: 'ITEM_FURNITURE', // always "ITEM_FURNITURE"
  SpecialFurnitureType: SpecialFurnitureType,
  FurnType: number[],
  SurfaceType: FurnitureSurfaceType,

  // Furniture Data:
  RankLevel: number,
  FurnitureGadgetId: number[],
  GridStyle: number,
  Comfort: number,          // Adeptal Energy
  Cost: number,             // Load
  DiscountCost: number,     // Reduced Load
  StackLimit: number,
  PushTipsId: number,
  ObtainTextMapHashList: number[],
  ObtainTextList: string[],

  // Custom Properties:
  MappedFurnType: HomeWorldFurnitureTypeExcelConfigData[],
  MakeData: FurnitureMakeExcelConfigData,
  RelatedMaterialId?: number,
  RelatedMaterial?: MaterialExcelConfigData,
  CategoryId?: number,
  CategoryNameText?: string;
  TypeId?: number,
  TypeNameText?: string;
  IsExterior?: boolean,
  IsInterior?: boolean,
  FilterTokens?: string[],
  HomeWorldNPC?: HomeWorldNPCExcelConfigData,
  HomeWorldAnimal?: HomeworldAnimalExcelConfigData,

  // Internal Data:
  Rank: number,
  Height: number,
  ClampDistance: number,
  EditorClampDistance: number,
  IsUnique: number,
  IsSpecialFurniture: number,
  DeployGlitchIndex: number,
  IsCombinableLight: number,
  RoomSceneId: number,
  ArrangeLimit: number,
  CanFloat: number,
  JsonName: string,
  GroupRecordType?:
    'GROUP_RECORD_TYPE_BALLOON'     |
    'GROUP_RECORD_TYPE_EXPLOSION'   |
    'GROUP_RECORD_TYPE_RACING'      |
    'GROUP_RECORD_TYPE_SEEK'        |
    'GROUP_RECORD_TYPE_STAKE'       ,
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

export type HomeWorldFurnitureTypeTree = {
  Interior: HomeWorldFurnitureTypeSubTree,
  Exterior: HomeWorldFurnitureTypeSubTree,
  InteriorAndExterior: HomeWorldFurnitureTypeSubTree,
};

export type HomeWorldFurnitureTypeSubTree = {
  [categoryId: number]: {
    categoryId: number,
    categoryName: string,
    types: {
      [typeId: number]: {
        typeId: number,
        typeName: string,
        typeIcon: string,
      }
    }
  }
};

export interface HomeworldAnimalExcelConfigData {
  FurnitureId: number,
  Furniture: HomeWorldFurnitureExcelConfigData,
  IsRebirth: number,
  Monster?: MonsterExcelConfigData,
  MonsterId: number,
  RebirthCD: number,
}

// Furniture Set
// --------------------------------------------------------------------------------------------------------------
export type FurnitureSuiteLoadConf = {
  LoadUnits?: boolean
}

export interface FurnitureSuiteUnit {
  FurnitureId: number,
  Furniture: HomeWorldFurnitureExcelConfigData,
  Count: number
}

export interface FurnitureSuiteExcelConfigData {
  SuiteId: number,
  JsonName: string,
  SuiteNameTextMapHash: number,
  SuiteDescTextMapHash: number,
  SuiteNameText: string,
  SuiteDescText: string,
  FurnType: number[],
  MappedFurnType: HomeWorldFurnitureTypeExcelConfigData[],
  MainFurnType: HomeWorldFurnitureTypeExcelConfigData,
  ItemIcon: string,
  InterRatio: number,
  FavoriteNpcExcelIdVec: number[],
  FavoriteNpcVec: HomeWorldNPCExcelConfigData[],
  TransStr: string,
  MapIcon: string,

  RelatedMaterialId?: number,
  RelatedMaterial?: MaterialExcelConfigData,
  Units?: FurnitureSuiteUnit[]
}

export type FurnitureSuiteTree = {[cat1: string]: {[cat2: string]: FurnitureSuiteExcelConfigData[]}};

// Furniture Make Config
// --------------------------------------------------------------------------------------------------------------
export interface FurnitureMakeExcelConfigData {
  ConfigId: number,
  FurnitureItemId: number,
  FurnitureItem?: HomeWorldFurnitureExcelConfigData,
  Count: number,
  Exp: number,
  MaterialItems: MaterialVecItem[],
  MakeTime: number,
  MaxAccelerateTime: number,
  QuickFetchMaterialNum: number,
}