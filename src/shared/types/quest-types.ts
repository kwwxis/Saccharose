import { DialogExcelConfigData, ManualTextMapConfigData, TalkExcelConfigData } from './dialogue-types';
import { ConfigCondition } from './general-types';

export type QuestType = 'AQ' | 'SQ' | 'EQ' | 'WQ';
export type MapByQuestType<T> = {
  AQ: T,
  SQ: T,
  EQ: T,
  WQ: T
};

export interface MainQuestExcelConfigData {
  Id: number,
  Series: number,
  ChapterId?: number,
  Type?: QuestType,
  ActiveMode: string,
  TitleText?: string,
  TitleTextEN?: string,
  TitleTextMapHash: number,
  DescText?: string,
  DescTextMapHash: number,
  LuaPath: string,
  SuggestTrackOutOfOrder?: boolean,
  SuggestTrackMainQuestList?: any[],
  RewardIdList: any[],
  ShowType: string,
  QuestExcelConfigDataList?: QuestExcelConfigData[],
  OrphanedTalkExcelConfigDataList?: TalkExcelConfigData[],
  OrphanedDialog?: DialogExcelConfigData[][],
  QuestMessages?: ManualTextMapConfigData[],
}

export interface QuestExcelConfigData {
  SubId: number,
  MainId: number,
  Order: number,
  DescText?: string,
  DescTextMapHash: number,
  StepDescText?: string,
  StepDescTextMapHash: number,
  ShowType: string, // e.g. "QUEST_HIDDEN"

  // Guide
  Guide: ConfigCondition,
  GuideTipsText?: string,
  GuideTipsTextMapHash: number,

  // Cond/Exec (no longer available?)
  AcceptCond: ConfigCondition[],
  AcceptCondComb: string,
  FinishCond: ConfigCondition[],
  FinishCondComb: string,
  FailCond: ConfigCondition[],
  FailCondComb: string,
  FinishExec: ConfigCondition[],
  FailExec: ConfigCondition[],
  BeginExec: ConfigCondition[],

  // NPC/Avatar (no longer available?)
  ExclusiveNpcList: number[],
  SharedNpcList: number[],
  TrialAvatarList: any[],
  ExclusivePlaceList: any[],

  // Custom:
  TalkExcelConfigDataList?: TalkExcelConfigData[],
  QuestMessages?: ManualTextMapConfigData[],
  OrphanedDialog?: DialogExcelConfigData[][],
}

export interface ChapterExcelConfigData {
  Id: number,
  BeginQuestId: number,
  EndQuestId: number,
  ChapterNumText: string
  ChapterNumTextMapHash: number,
  ChapterTitleText: string,
  ChapterTitleTextMapHash: number,
  ChapterIcon: string,
  ChapterImageHashSuffix: number,
  ChapterImageHashPre: number,
  ChapterImageTitleText: string,
  ChapterImageTitleTextMapHash: number,
  ChapterSerialNumberIcon: string
  NeedPlayerLevel?: number,
  Type?: QuestType,
  Quests?: MainQuestExcelConfigData[],
}