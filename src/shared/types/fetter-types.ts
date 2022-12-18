import { LangCode } from './dialogue-types';
import { AvatarExcelConfigData } from './general-types';

// Fetter Condition Types
// ----------------------------------------------------------------------------------------------------

export interface FetterCondSummary {
  Friendship?: number,
  Quest?: string,

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

export interface FetterExcelConfigDataTextMap {
  EN: string,
  CHS: string,
  CHT: string,
  JP: string,
  KR: string,
}

export interface FetterExcelConfigData extends FetterWithConditions {
  Type: 1 | 2,
  VoiceFile: string,
  VoiceTitleTextMapHash: number,
  VoiceFileTextMapHash: number,
  VoiceTitleLockedTextMapHash: number,
  FetterId: number,
  AvatarId: number,
  IsHiden: boolean, // this is misspelled in the source JSON, do not fix
  HideCostumeList: number[],
  ShowCostumeList: number[],

  // Custom Text Props:
  VoiceTitleText?: string,
  VoiceFileText?: string,
  VoiceTitleLockedText?: string,

  // Custom Other Languages:
  VoiceTitleTextMap?: FetterExcelConfigDataTextMap,
  VoiceFileTextMap?: FetterExcelConfigDataTextMap,
  VoiceTitleLockedTextMap?: FetterExcelConfigDataTextMap,

  // Custom:
  Avatar?: AvatarExcelConfigData,
}

export class CharacterFetters {
  avatar?: AvatarExcelConfigData = null;
  storyFetters: FetterExcelConfigData[] = [];
  combatFetters: FetterExcelConfigData[] = [];
}

export type CharacterFettersByAvatar = {[avatarId: number]: CharacterFetters};