import { EquipAffixExcelConfigData } from './general-types.ts';
import { Readable } from './readable-types.ts';
import { TextMapHash } from '../lang-types.ts';
import { OLResult } from '../ol-types.ts';

export type ReliquaryEquipType =
  'EQUIP_BRACER'    | // Flower
  'EQUIP_NECKLACE'  | // Plume
  'EQUIP_SHOES'     | // Sands
  'EQUIP_RING'      | // Goblet
  'EQUIP_DRESS'     ; // Circlet

export interface ReliquaryExcelConfigData {
  EquipType: ReliquaryEquipType,
  EquipName: string,
  ShowPic: string,
  RankLevel: number,
  MainPropDepotId: number,
  AppendPropDepotId: number,
  BaseConvExp: number,
  MaxLevel: number,
  Id: number,
  NameText: string,
  DescText: string,
  NameTextMapHash: number,
  DescTextMapHash: number,
  Icon: string,
  ItemType: 'ITEM_RELIQUARY',
  Weight: number,
  Rank: number,
  GadgetId: number,
  AppendPropNum: number,
  SetId: number,
  AddPropLevels: number[],
  StoryId: number,
  DestroyRule?: 'DESTROY_RETURN_MATERIAL',
  DestroyReturnMaterial: number[],
  DestroyReturnMaterialCount: number[],
  Dropable: boolean,
  Story?: Readable;
}

export interface ReliquaryCodexExcelConfigData {
  Id: number,
  SuitId: number,
  Level: number,
  CupId: number,
  LeatherId: number,
  CapId: number,
  FlowerId: number,
  SandId: number,
  SortOrder: number,
}

export type ReliquaryLoadConf = {
  LoadStory?: boolean,
};

export type ReliquarySetLoadConf = {
  LoadArtifacts?: boolean,
  LoadStories?: boolean,
};

export interface ReliquarySetExcelConfigData {
  SetId: number
  SetIcon: string,
  SetNameText: string,
  SetNameTextMapHash: TextMapHash;
  SetNeedNum: number[],
  EquipAffixId: number,
  EquipAffixList?: EquipAffixExcelConfigData[],
  ContainsList: number[],
  ArtifactSlots?: ArtifactsOfSet,
  BagSortValue: number,
  TextList: number[],
  InjectedOL?: OLResult
}

export type ArtifactsOfSet = {
  EQUIP_BRACER: ArtifactsOfSetSlot,
  EQUIP_NECKLACE: ArtifactsOfSetSlot,
  EQUIP_SHOES: ArtifactsOfSetSlot,
  EQUIP_RING: ArtifactsOfSetSlot,
  EQUIP_DRESS: ArtifactsOfSetSlot,
}

export type ArtifactsOfSetSlot = {
  EquipName: string,
  EquipType: ReliquaryEquipType,
  RANK_4: ReliquaryExcelConfigData,
  RANK_5: ReliquaryExcelConfigData,
  InjectedOL?: OLResult
}
