import { isInt } from '../../util/numberUtil.ts';

export type BydMaterialExcelConfigDataItemUseOp =
  'BYD_MATERIAL_USE_ADD_SELECT_ITEM_UNREPEATABLE' |
  'BYD_MATERIAL_USE_GAIN_COSTUME'                 |
  'BYD_MATERIAL_USE_GAIN_COSTUME_DRAWING'         |
  'BYD_MATERIAL_USE_GAIN_COSTUME_SUIT'            |
  'BYD_MATERIAL_USE_GAIN_EMOJI'                   |
  'BYD_MATERIAL_USE_GAIN_POSE'                    |
  'BYD_MATERIAL_USE_GAIN_TRANSFER_EFFECT'         |
  'BYD_MATERIAL_USE_GAIN_TRIAL_COSTUME_SUIT'      |
  'BYD_MATERIAL_USE_NONE'                         |
  'BYD_MATERIAL_USE_OPEN_DROP_EXTRA'              |
  'BYD_MATERIAL_USE_UNLOCK_PRIVATE_HALL'          ;
export type BydMaterialType =
  'BEYOND_MATERIAL_COSTUME'                           |
  'BEYOND_MATERIAL_COSTUME_DRAWING'                   |
  'BEYOND_MATERIAL_COSTUME_GACHA_DISCOUNT_COUPON'     |
  'BEYOND_MATERIAL_COSTUME_SHOP_DISCOUNT_COUPON'      |
  'BEYOND_MATERIAL_COSTUME_SUIT'                      |
  'BEYOND_MATERIAL_EMOJI'                             |
  'BEYOND_MATERIAL_HALL_UNLOCK'                       |
  'BEYOND_MATERIAL_NORMAL'                            |
  'BEYOND_MATERIAL_ORANGE_COSTUME_TRANS_COIN'         |
  'BEYOND_MATERIAL_POSE'                              |
  'BEYOND_MATERIAL_TRANSFER_EFFECT'                   |
  'BEYOND_MATERIAL_TRIAL_COSTUME_SUIT'                |
  'BEYOND_MATERIAL_TYPE_BUNDLE'                       |
  'BEYOND_MATERIAL_TYPE_DROP_EXTRA_CHEST'             |
  'BEYOND_MATERIAL_TYPE_UNREPEATABLE_SELECTABLE_CHEST';

export type BydMaterialLoadConf = {LoadItemUse?: boolean};

export interface BydMaterialExcelConfigData {
  BydMaterialType: BydMaterialType,
  CJIIKHAEBAF: number,
  DBNOHODFJMC: string,
  DescText: string,
  DescTextMapHash: number,
  Dropable: boolean,
  GadgetId: number,
  GlobalItemLimit: number,
  Icon: string,
  IconUrl?: string,
  DownloadIconUrl?: string,
  Id: number,
  IsForceGetHint: boolean,
  ItemType: 'ITEM_BEYOND_MATERIAL',
  ItemUse: {
    UseOp: BydMaterialExcelConfigDataItemUseOp,
    UseParam?: string[]
  }[],
  MaxUseCount: number,
  NBKNLDMFPPL: number,
  NBKNLDMFPPL_Text: string,
  NameText: string,
  NameTextMapHash: number,
  Rank: number,
  RankLevel: number,
  StackLimit: number,
  UseLevel: number,
  UseOnGain: boolean,
  Weight: number,
  LoadedItemUse?: {
    Costume?: BeyondCostumeExcelConfigData,
    CostumeSuit?: BeyondCostumeSuitExcelConfigData,
  }
}

export interface BydMaterialSourceExcelConfigData {
  Id: number,
  TextList: number[],
}

export type BeyondCostumeBodyType = 'BODY_BODY' | 'BODY_GIRL';
export type BeyondRarity = 'Blue' | 'Green' | 'Orange' | 'Red' | 'None';
export type BeyondSwitchType =
  'Switch_Boots_Hard'         |
  'Switch_Boots_Soft'         |
  'Switch_Common_Hard'        |
  'Switch_Geta'               |
  'Switch_Heavy'              |
  'Switch_Heels_Block'        |
  'Switch_Leather'            |
  'Switch_Leather_WithMetal'  |
  'Switch_Light'              |
  'Switch_Mid'                |
  'Switch_Slipper'            |
  'Switch_Sneakers'           ;
export type BeyondCostumeComponentSlot =
  'All'           |
  'Backpiece'     |
  'Bracelet'      |
  'Earrings'      |
  'EyeShadow'     |
  'EyeSocket'     |
  'Eyebrows'      |
  'Eyewear'       |
  'FacialMakeup'  |
  'Hairstyle'     |
  'Headwear'      |
  'Leglet'        |
  'Lipstick'      |
  'LowerCloth'    |
  'Mask'          |
  'Necklace'      |
  'Pupil'         |
  'Shoes'         |
  'SkinTone'      |
  'UpperCloth'    |
  'WaistAcc1'     |
  'WaistAcc2'     ;
export type BeyondColorScheme = 'Black' | 'Blue' | 'Brown' | 'Gray' | 'Green' | 'Multi' | 'Orange' | 'Purple' | 'Red' | 'White' | 'Yellow';

export interface BeyondCostumeExcelConfigData {
  CostumeId: number,
  SortId: number,
  SuitId: number,
  IsTrial: boolean,
  Rarity: BeyondRarity,
  VividRating: number,

  BodyType: BeyondCostumeBodyType[],
  ColorScheme: BeyondColorScheme[],
  ComponentSlot1: { ComponentSlot2: BeyondCostumeComponentSlot[] }[],
  ComponentSlotId: number[],
  ComponentFlatSlots?: BeyondCostumeComponentSlot[],

  NameText: string,
  NameTextMapHash: number,
  DescriptionText: string,
  DescriptionTextMapHash: number,

  NonAscendedCostumeId: number,
  NonTrialEquivalentCostumeId: number,

  EOJEBBEGFBI: string,
  IFNNDCKNDCO: string[],
  MKACFNHPGBG: number,
  IconHash: string|number,
  Icon?: string,
  IconUrl?: string,
}

export function isBeyondCostume(x: any): x is BeyondCostumeExcelConfigData {
  return x && isInt(x.CostumeId) && (x.ComponentSlot1 || x.VividRating);
}

export type BeyondCostumeSuitSource = 'BP' | 'GachaFree' | 'GachaPaid' | 'None' | 'Shop';
export type BeyondCostumeSuitExcelConfigDataShowType = 'BYD_COSTUME_SUIT_SHOW_TYPE_BY_SLOT_AND_SUIT' | 'BYD_COSTUME_SUIT_SHOW_TYPE_ONLY_SUIT';

export interface BeyondCostumeSuitExcelConfigData {
  SuitId: number,
  SortId: number,
  Rarity: BeyondRarity,
  VividRating: number,

  SetComponents?: BeyondCostumeExcelConfigData[],
  ShowType: string,

  NameText: string,
  NameTextMapHash: number,
  DescriptionText: string,
  DescriptionTextMapHash: number,

  BodyType: BeyondCostumeBodyType[],
  ColorScheme: BeyondColorScheme[],

  IconHash: string,
  Icon?: string,
  IconUrl?: string,

  SuitSource: BeyondCostumeSuitSource,
  BJPPNIPKGOI: boolean,
  CCNLLHCNENE: number,
  CHPEHOOKEMH: string,
  DLHIOHMGAFN: number|string,
  DMKFPGJLKFE: string,
  JKOIAGBNEPM: boolean,
  LJDPGLEPKMF: { 6: number },
  OKKOMOCBGNM: string,
  PGGGJDBAJBP: string,
  PNFLGFBKKAJ: number,
}

export function isBeyondCostumeSuit(x: any): x is BeyondCostumeSuitExcelConfigData {
  return x && isInt(x.SuitId) && (x.SuitSource || x.VividRating);
}
