export type PushTipsCodexType =
  'CODEX_ADVENTURE'
  | 'CODEX_ARANARA'
  | 'CODEX_ELEMENT'
  | 'CODEX_ENEMY'
  | 'CODEX_SYSTEM'
  | 'CODEX_UNRECORDED';

export interface PushTipsConfigData {
  PushTipsId: number,
  TutorialId: number,
  RewardId: number,

  PushTipsType: 'PUSH_TIPS_MONSTER' | 'PUSH_TIPS_TUTORIAL',
  CodexType?: PushTipsCodexType,

  TitleTextMapHash: number,
  SubtitleTextMapHash: number,
  TitleText: string,
  SubtitleText: string,

  ShowImmediately: boolean,
  GroupId: number,
  ShowIcon?: string,
  TabIcon: string,

  Codex?: PushTipsCodexExcelConfigData,
}

export interface PushTipsCodexExcelConfigData {
  Id: number,
  PushTipId: number,
  SortOrder: number,
}

export interface TutorialExcelConfigData {
  Id: number,
  DetailIdList: number[],
  MobileDetailIdList: number[],
  JoypadDetailIdList: number[],
  PauseGame: boolean,
  IsMultiPlatform: boolean,

  DetailList?: TutorialDetailExcelConfigData[],
  PushTip?: PushTipsConfigData,
  Wikitext?: string,
}

export interface TutorialCatalogExcelConfigData {
  Id: number,
  PushTipsId: number,
  TitleTextMapHash: number,
  TitleText: string,
}

export interface TutorialDetailExcelConfigData {
  Id: number,
  ImageNameList: string[],
  DescriptTextMapHash: number,
  DescriptText: string,
}

export type TutorialsByType = { [type: string]: TutorialExcelConfigData[] };