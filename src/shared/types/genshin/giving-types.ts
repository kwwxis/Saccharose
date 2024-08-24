export type GivingExcelConfigDataTab = 'TAB_AVATAR' | 'TAB_CONSUME' | 'TAB_FOOD' | 'TAB_MATERIAL' | 'TAB_QUEST' | 'TAB_WEAPON' | 'TAB_WIDGET';
export type GivingExcelConfigDataGivingMethod = 'GIVING_METHOD_EXACT' | 'GIVING_METHOD_GROUP' | 'GIVING_METHOD_VAGUE_GROUP';
export type GivingExcelConfigDataGivingType = 'GIVING_TYPE_GADGET' | 'GIVING_TYPE_QUEST';

export interface GivingExcelConfigData {
  Id: number,

  Icon: string,
  Tab: GivingExcelConfigDataTab,
  GivingMethod: GivingExcelConfigDataGivingMethod,
  GivingType: GivingExcelConfigDataGivingType,

  // ExactItems & ExactFinishTalkId only used when GivingType is 'GIVING_METHOD_EXACT'
  ExactItems?: { Id: number, Count: number }[],
  ExactFinishTalkId?: number,

  // GivingGroupIds & GivingGroupCount only used when GivingType is 'GIVING_METHOD_GROUP' or 'GIVING_METHOD_VAGUE_GROUP'
  GivingGroupIds?: number[],
  GivingGroupCount?: number,

  TalkId?: number,
  MistakeTalkId?: number,

  Highlight?: boolean,
  IsMpEnable?: boolean,
  IsRemoveItem?: boolean,
  IsRepeatable?: boolean,
  IsReset?: boolean,
  IsTakeBack?: boolean,
}

export interface GivingGroupExcelConfigData {
  FinishDialogId: number,
  FinishTalkId: number,
  Id: number,
  ItemIds: number[],
  MistakeTalkId: number,
}
