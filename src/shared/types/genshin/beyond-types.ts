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
}

export interface BydMaterialSourceExcelConfigData {
  Id: number,
  TextList: number[],
}
