export type ReliquaryEquipType =
  'EQUIP_BRACER'    | // Flower
  'EQUIP_DRESS'     | // Circlet
  'EQUIP_NECKLACE'  | // Plume
  'EQUIP_RING'      | // Goblet
  'EQUIP_SHOES'     ; // Sands

export const RELIC_EQUIP_TYPE_TO_NAME: {[equipType: string]: ReliquaryEquipName} = {
  'EQUIP_BRACER': 'Flower',
  'EQUIP_DRESS': 'Circlet',
  'EQUIP_NECKLACE': 'Plume',
  'EQUIP_RING': 'Goblet',
  'EQUIP_SHOES': 'Sands',
}

export type ReliquaryEquipName = 'Flower' | 'Circlet' | 'Plume' | 'Sands' | 'Goblet';

export interface ReliquaryExcelConfigData {
  EquipType: ReliquaryEquipType,
  EquipName: ReliquaryEquipName,
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

export interface ReliquarySetExcelConfigData {
  SetId: number
  SetIcon: string,
  SetNeedNum: number[],
  EquipAffixId: number,
  ContainsList: number[],
  BagSortValue: number,
  TextList: number[],
}