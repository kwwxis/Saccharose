import { DialogExcelConfigData, ManualTextMapConfigData, TalkExcelConfigData } from './dialogue-types';
import { ConfigCondition } from './general-types';
import { RewardExcelConfigData } from './material-types';

export type QuestType = 'AQ' | 'SQ' | 'EQ' | 'WQ';
export type MapByQuestType<T> = {
  AQ: T,
  SQ: T,
  EQ: T,
  WQ: T
};

export interface ChapterCollection {
  AQ: {[chapterName: string]: {[subChapterName: string]: ChapterExcelConfigData[]}},
  SQ: {[chapterName: string]: {[subChapterName: string]: ChapterExcelConfigData[]}},
  EQ: {[chapterName: string]: ChapterExcelConfigData[]},
  WQ: {[chapterName: string]: ChapterExcelConfigData[]},
}

export interface MainQuestExcelConfigData {
  Id: number,
  Series: number,
  ChapterId?: number,
  Type?: QuestType,
  ActiveMode: string,
  TitleText?: string,
  TitleTextMapHash: number,
  DescText?: string,
  DescTextMapHash: number,
  LuaPath: string,
  SuggestTrackOutOfOrder?: boolean,
  SuggestTrackMainQuestList?: number[],
  RewardIdList: number[],
  ShowType: string,

  QuestExcelConfigDataList?: QuestExcelConfigData[],
  UnsectionedTalks?: TalkExcelConfigData[],
  NonTalkDialog?: DialogExcelConfigData[][],
  QuestMessages?: ManualTextMapConfigData[],
  __globalVarPos?: number,
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
  BeginExec: ConfigCondition[],

  FailCond: ConfigCondition[],
  FailCondComb: string,
  FailExec: ConfigCondition[],

  FinishCond: ConfigCondition[],
  FinishCondComb: string,
  FinishExec: ConfigCondition[],

  // Custom:
  TalkExcelConfigDataList?: TalkExcelConfigData[],
  QuestMessages?: ManualTextMapConfigData[],
  NonTalkDialog?: DialogExcelConfigData[][],
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
  Summary?: ChapterSummary;
}

export interface ChapterSummary {
  ChapterNum: number,
  ChapterRoman: string,
  ChapterNumText: string,
  ChapterName: string,

  ActNum: number,
  ActName: string,
  ActNumText: string,
  ActRoman: string,
  ActType: string,

  AQCode: string,
}

export interface ReputationQuestExcelConfigData {
  ParentQuestId: number,
  CityId: number,
  CityName?: string,
  RewardId: number,
  Reward?: RewardExcelConfigData,
  IconName: string,
  TitleText: string,
  TitleTextMapHash: number,
  Order: number
}