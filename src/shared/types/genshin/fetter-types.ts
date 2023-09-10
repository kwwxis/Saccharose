
import { AvatarExcelConfigData } from './avatar-types';
import { LangCode, LangCodeMap } from '../lang-types';

// Fetter Condition Types
// ----------------------------------------------------------------------------------------------------

export interface FetterCondSummary {
  Friendship?: number,
  QuestTitleTextMap?: LangCodeMap,
  QuestId?: number,
  QuestType?: 'MainQuest' | 'Chapter',

  AscensionPhase?: number,
  Birthday?: boolean,
  Waypoint?: string, // only for Traveler VOs
  Statue?: string, // only for Traveler VOs
}

export type FetterCondType =
  'FETTER_COND_AVATAR_PROMOTE_LEVEL' |  // ascension phase
  'FETTER_COND_FETTER_LEVEL' |          // friendship level
  'FETTER_COND_FINISH_PARENT_QUEST' |   // quest requirement (Param is MainQuestExcelConfigData ID)
  'FETTER_COND_FINISH_QUEST' |          // quest requirement (Param is QuestExcelConfigData ID)
  'FETTER_COND_PLAYER_BIRTHDAY' |       // player birthday
  'FETTER_COND_UNLOCK_TRANS_POINT';     // unlock waypoint

export type FetterCond = {
  CondType: FetterCondType,
  ParamList: number[]
};

export interface FetterWithConditions {
  OpenConds?: FetterCond[],
  FinishConds?: FetterCond[],
  OpenCondsSummary?: FetterCondSummary,
  FinishCondsSummary?: FetterCondSummary,
  Tips: number[],
  MappedTips?: string[],
}

// Character Story Fetter Types
// ----------------------------------------------------------------------------------------------------

export interface FetterStoryExcelConfigData extends FetterWithConditions {
  FetterId: number,
  AvatarId: number,
  Avatar?: AvatarExcelConfigData,

  StoryTitleTextMapHash: number,
  StoryContextTextMapHash: number,
  StoryTitleText: string,
  StoryContextText: string,
  StoryContextHtml: string,

  StoryTitle2TextMapHash: number,
  StoryContext2TextMapHash: number,
  StoryTitle2Text: string,
  StoryContext2Text: string,
  StoryContext2Html: string,

  StoryTitleLockedTextMapHash?: number,
}

export class StoryFetters {
  avatar: AvatarExcelConfigData;
  fetters: FetterStoryExcelConfigData[] = [];
  wikitext: string = '';
  alteredWikitext: string = '';
  hasAlteredStories: boolean = false;
}

export type StoryFettersByAvatar = {
  [avatarId: number]: StoryFetters
};

// Character VO Fetter Types
// ----------------------------------------------------------------------------------------------------

export interface FetterExcelConfigData extends FetterWithConditions {
  Type: 1 | 2,
  VoiceFile: string,
  VoiceTitleTextMapHash: number,
  VoiceFileTextMapHash: number,
  VoiceTitleLockedTextMapHash: number,
  FetterId: number,
  AvatarId: number,
  IsHidden: boolean,
  HideCostumeList: number[],
  ShowCostumeList: number[],

  // Custom Prop:
  VoiceFilePath?: string,

  // Custom Other Languages:
  VoiceTitleTextMap?: LangCodeMap, // used by VO-Tool
  VoiceFileTextMap?: LangCodeMap, // used by VO-Tool
  VoiceTitleLockedTextMap?: LangCodeMap,

  // Custom:
  Avatar?: AvatarExcelConfigData,
}

export class CharacterFetters {
  avatar?: AvatarExcelConfigData = null;
  avatarName: LangCodeMap;
  storyFetters: FetterExcelConfigData[] = [];
  combatFetters: FetterExcelConfigData[] = [];

  voAvatarName: string = null;
  fetterFiles: string[] = [];
  animatorEventFiles: string[] = [];
}

export type CharacterFettersByAvatar = {[avatarId: number]: CharacterFetters};

// Character Info Types
// ----------------------------------------------------------------------------------------------------
export interface FetterInfoExcelConfigData {
  InfoBirthMonth: number,
  InfoBirthDay: number,
  AvatarNativeTextMapHash: number,
  AvatarVisionBeforTextMapHash: number,
  AvatarConstellationBeforTextMapHash: number,
  AvatarTitleTextMapHash: number,
  AvatarDetailTextMapHash: number,
  AvatarAssocType: string,
  CvChineseTextMapHash: number,
  CvJapaneseTextMapHash: number,
  CvEnglishTextMapHash: number,
  CvKoreanTextMapHash: number,
  AvatarVisionAfterTextMapHash: number,
  AvatarConstellationAfterTextMapHash: number,
  FetterId: number,
  AvatarId: number,
  OpenConds: never,
  FinishConds: { CondType: string, ParamList?: number[] }[],
  AvatarNativeText: string,
  AvatarVisionBeforeText: string,
  AvatarConstellationBeforeText: string,
  AvatarTitleText: string,
  AvatarDetailText: string,
  CvChineseText: string,
  CvJapaneseText: string,
  CvEnglishText: string,
  CvKoreanText: string,
  Avatar?: AvatarExcelConfigData,
  AvatarVisionAfterText: string,
  AvatarConstellationAfterText: string,
}