import { GenshinImage } from './general-types.ts';
import { Marker } from '../../util/highlightMarker.ts';
export type PushTipsCodexType =
  'CODEX_ADVENTURE'
  | 'CODEX_ARANARA'
  | 'CODEX_ELEMENT'
  | 'CODEX_ENEMY'
  | 'CODEX_SYSTEM'
  | 'CODEX_UNRECORDED'
  | 'CODEX_NEWACTIVITY'
  | 'CODEX_NONPUSH';

export const PushTipsCodexTypeList: PushTipsCodexType[] = ['CODEX_ADVENTURE', 'CODEX_ARANARA', 'CODEX_ELEMENT',
  'CODEX_ENEMY', 'CODEX_SYSTEM', 'CODEX_UNRECORDED', 'CODEX_NEWACTIVITY', 'CODEX_NONPUSH'];

export interface GenericPushTip {
  PushTipsId: number,
  TutorialId: number,
  CodexType?: PushTipsCodexType,

  TitleTextMapHash: number,
  SubtitleTextMapHash: number,
  TitleText: string,
  SubtitleText: string,

  ShowIcon?: string,
  TabIcon?: string,
  ShowImmediately: boolean,
  Codex?: PushTipsCodexExcelConfigData,
}

export interface PushTipsConfigData extends GenericPushTip {
  RewardId: number,
  PushTipsType: 'PUSH_TIPS_MONSTER' | 'PUSH_TIPS_TUTORIAL',
  GroupId: number,
}

export interface NewActivityPushTipsConfigData extends GenericPushTip {
  ActivityId: number,
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

  CodexType: PushTipsCodexType,

  DetailList?: TutorialDetailExcelConfigData[],
  PushTip?: GenericPushTip,
  Wikitext?: string,
  WikitextMarkers: Marker[],
  Images?: GenshinImage[]
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